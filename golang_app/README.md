## Database migrations
```bash
atlas schema inspect --env gorm --url "env://src"
atlas migrate diff --env gorm
atlas migrate apply -u "sqlite://dev.db" --dir "file://migrations"
```
