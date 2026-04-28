# UpGrade Learning & Development

[![Déployer sur Infomaniak](../../actions/workflows/deploy.yml/badge.svg?branch=main)](../../actions/workflows/deploy.yml)

Site vitrine statique pour UpGrade, cabinet de conseil Learning & Development.

## Déploiement

Le site est déployé automatiquement sur Infomaniak via FTP à chaque push sur `main`.
Vous pouvez aussi lancer un déploiement manuel depuis l'onglet **Actions → Déployer sur Infomaniak → Run workflow**.

### Secrets GitHub requis

Configurez les secrets suivants dans **Settings → Secrets and variables → Actions** :

- `FTP_HOST`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_PORT`
