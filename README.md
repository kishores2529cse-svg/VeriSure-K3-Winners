# VeriSure-K3-Winners
AI Driven Fraud and Anomaly Detection System

## UPI verification

The UPI page posts a public UPI address to `POST /api/verify-upi`. In local development it uses a clearly labeled demo provider. To connect an authorized provider, set both environment variables before starting the backend:

```text
UPI_VERIFICATION_API_URL=https://authorized-provider.example/verify
UPI_VERIFICATION_API_KEY=your-provider-key
```

The provider adapter sends `upi_id` as a query parameter and expects `valid`, `beneficiary_name`, and `reported` fields in its JSON response. The application never accepts or stores payment credentials such as UPI PINs, OTPs, CVVs, or passwords.
