# YOLO Proctor Service

Install dependencies from the repository root:

```powershell
C:\Users\Hp\AppData\Local\Programs\Python\Python312\python.exe -m pip install -r yolo-proctor\requirements.txt
```

Start the WebSocket service:

```powershell
C:\Users\Hp\AppData\Local\Programs\Python\Python312\python.exe yolo-proctor\main.py
```

The first start downloads `yolov8n.pt` into this directory and listens on
`ws://localhost:8082/ws/proctor`. Set `YOLO_MODEL`, `YOLO_HOST`, or `YOLO_PORT`
to override the defaults.