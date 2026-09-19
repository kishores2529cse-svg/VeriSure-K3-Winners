import asyncio
import base64
import json
import logging
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from ultralytics import YOLO
from websockets.asyncio.server import ServerConnection, serve

HOST = os.getenv("YOLO_HOST", "localhost")
PORT = int(os.getenv("YOLO_PORT", "8082"))
MODEL_PATH = os.getenv("YOLO_MODEL", str(Path(__file__).resolve().parent / "yolov8n.pt"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("yolo-proctor")


def decode_image(data_url: str) -> np.ndarray:
    """Decode a browser data URL into an OpenCV BGR image."""
    encoded = data_url.split(",", 1)[1] if "," in data_url else data_url
    image_bytes = base64.b64decode(encoded)
    image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image")
    return image


def detect_phone(model: YOLO, image: np.ndarray) -> dict[str, Any]:
    """Return the highest-confidence cell-phone detection in the frame."""
    result = model.predict(image, verbose=False, device="cpu", classes=[67])[0]
    boxes = result.boxes
    if boxes is None or len(boxes) == 0:
        return {"detected": False}

    confidence = float(boxes.conf.max().item())
    return {
        "detected": True,
        "object": "cell phone",
        "confidence": round(confidence, 3),
    }


async def handle_client(websocket: ServerConnection) -> None:
    logger.info("Client connected: %s", websocket.remote_address)
    try:
        async for message in websocket:
            try:
                payload = json.loads(message)
                image_data = payload.get("image")
                if not isinstance(image_data, str):
                    await websocket.send(json.dumps({"error": "image is required"}))
                    continue

                response = detect_phone(model, decode_image(image_data))
                await websocket.send(json.dumps(response))
            except (ValueError, json.JSONDecodeError, base64.binascii.Error) as error:
                logger.warning("Invalid frame: %s", error)
                await websocket.send(json.dumps({"detected": False, "error": "invalid image"}))
            except Exception:
                logger.exception("Frame processing failed")
                await websocket.send(json.dumps({"detected": False, "error": "processing failed"}))
    except Exception:
        logger.info("Client disconnected: %s", websocket.remote_address)


model = YOLO(MODEL_PATH)


async def main() -> None:
    logger.info("Loading YOLO model: %s", MODEL_PATH)
    logger.info("YOLO proctor WebSocket listening on ws://%s:%s/ws/proctor", HOST, PORT)
    async with serve(handle_client, HOST, PORT, ping_interval=20, ping_timeout=20):
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("YOLO proctor stopped")
