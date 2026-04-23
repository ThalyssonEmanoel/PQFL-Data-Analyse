# Step - 6: Deploy Folder Preparation (Kubernetes Ready)

In this phase, I prepare deployment assets without actually deploying yet.

## 1) Keep `Deploy/` now, deploy later

I will create `Deploy/` now as requested and keep deployment implementation for a later phase.

## 2) Suggested files to place in `Deploy/`

Even if placeholders for now:

- `README.md`
- `deployment.yaml`
- `service.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `hpa.yaml` (optional, later)
- `ingress.yaml` (optional, later)

## 3) Infra best practices I plan to follow

- Readiness and liveness probes (`/api/v1/health`).
- Resource requests/limits.
- Externalized config through env vars.
- No secrets in git.
- Rolling updates strategy.

## 4) Container preparation checklist

When I move to deployment implementation, I will add:

- Production Dockerfile.
- `.dockerignore`.
- Non-root container user.
- Healthcheck path matching app health endpoint.

## 5) Operational readiness notes

Before real deploy, I want:

- Structured logs enabled.
- Graceful shutdown validated.
- DB/index evolution strategy defined for pipeline (`migrate-mongo up` and index sync process).
- Environment matrix documented (dev, staging, prod).

## 6) Frontend migration plan (later phase)

Only after backend is stable:

1. Point frontend API calls to backend endpoints.
2. Validate parity against current behavior.
3. Switch feature by feature.
4. Remove old direct data coupling.

This keeps risk low and avoids a hard cutover.

## Definition of done for this step

- Deploy folder strategy is defined.
- Kubernetes artifacts are planned.
- Backend is ready for next phase (actual container and cluster rollout).
