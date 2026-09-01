.DEFAULT_GOAL := help

API_DIR := apps/api
WEB_DIR := apps/web

.PHONY: help install up down ps logs migrate generate api web dev stop cluster cluster-down cluster-logs cluster-ps

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies for the api and web apps
	cd $(API_DIR) && npm install
	cd $(WEB_DIR) && npm install

up: ## Start Postgres, Redis, and RabbitMQ (waits until healthy)
	docker compose up -d --wait postgres redis rabbitmq

down: ## Stop and remove the docker compose services
	docker compose down

ps: ## Show status of docker compose services
	docker compose ps

logs: ## Tail Postgres, Redis, and RabbitMQ logs
	docker compose logs -f postgres redis rabbitmq

migrate: up ## Apply the better-auth database schema
	cd $(API_DIR) && npx auth@latest migrate --config src/auth/auth.ts -y

generate: ## Regenerate the better-auth migration SQL (does not apply it)
	cd $(API_DIR) && npx auth@latest generate --config src/auth/auth.ts -y

api: up ## Run the API dev server (NestJS, port 3000)
	cd $(API_DIR) && npm run start:dev

web: ## Run the web dev server (Vite, port 5173)
	cd $(WEB_DIR) && npm run dev -- --port 5173

dev: up ## Run Postgres, the API, and the web app together
	@trap 'kill 0' EXIT INT TERM; \
	(cd $(API_DIR) && npm run start:dev) & \
	(cd $(WEB_DIR) && npm run dev -- --port 5173) & \
	wait

stop: ## Kill anything left running on the dev ports (3000, 5173)
	-fuser -k 3000/tcp 5173/tcp

cluster: ## Build and run 3 containerized API instances behind nginx (requires apps/api/.env). App at :8080
	COMPOSE_PROFILES=cluster docker compose up -d --build

cluster-down: ## Stop the cluster profile (api1-3, nginx) — leaves postgres/redis/rabbitmq running
	COMPOSE_PROFILES=cluster docker compose stop api1 api2 api3 nginx

cluster-logs: ## Tail logs from the 3 API instances and nginx
	COMPOSE_PROFILES=cluster docker compose logs -f api1 api2 api3 nginx

cluster-ps: ## Show status of the cluster containers
	COMPOSE_PROFILES=cluster docker compose ps
