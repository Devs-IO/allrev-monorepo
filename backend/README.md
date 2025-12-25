# AllRev - API Back-end (NestJS & Multi-Tenant)

Esta é a API back-end para a plataforma AllRev, um sistema SaaS (Software as a Service) Multi-Tenant projetado para gestão de revisões e clientes. Construído com **NestJS**, **TypeScript** e **TypeORM**, o sistema oferece uma arquitetura modular e segura para gerenciar múltiplas empresas (Tenants) em uma única base de código.

## 🚀 Tecnologias Principais

* **Linguagem:** TypeScript
* **Framework:** NestJS
* **Banco de Dados:** PostgreSQL
* **ORM:** TypeORM (com Migrations)
* **Autenticação:** JWT (JSON Web Token) com Passport.js
* **Autorização:** Controle de Acesso Baseado em Papéis (RBAC) via Guards
* **Testes:** Jest (configurado para unitários e e2e)
* **Conteinerização:** Docker e Docker Compose

## 🏛️ Arquitetura

O projeto utiliza uma arquitetura modular, dividindo as responsabilidades de negócio de forma clara. O pilar central do design é a **Multi-Tenancy**, permitindo que um Usuário pertença a múltiplos Tenants (empresas) com papéis diferentes em cada um, um padrão de SaaS flexível e escalável.

### Módulos de Negócio

* **`AuthModule`**: Lida com login (`local.strategy`), validação de tokens (`jwt.strategy`) e gerenciamento de sessão.
* **`TenantModule`**: Gerencia o CRUD das empresas (locatários), controlando status de pagamento e assinatura.
* **`UserModule`**: Gerencia o CRUD de usuários e sua associação aos Tenants e Papéis (Roles).
* **`ClientModule`**: Gerencia os clientes finais de cada Tenant.
* **`ProductModule` / `KitModule`**: Gerencia os produtos e kits (ex: energia solar) que podem ser orçados.
* **`EstimateModule` / `OrdersModule`**: Controla a criação de orçamentos e a conversão em pedidos.
* **`RoleModule`**: Gerencia os papéis (ex: Admin, Manager_Reviewers) que são usados pelos Guards de RBAC.

## ⚙️ Como Rodar (Desenvolvimento)

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/Devs-IO/allrev-backend.git](https://github.com/Devs-IO/allrev-backend.git)
    cd allrev-backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Ambiente:**
    * Copie `.env.example` (se existir) para `.env`.
    * Preencha as variáveis de ambiente (Banco de Dados, Porta, `JWT_SECRET`).

4.  **Inicie o Banco de Dados (via Docker):**
    * Se você tiver um `compose.yaml` configurado para o banco:
    ```bash
    docker compose up -d database 
    ``` 
    *(O nome do serviço pode variar)*

5.  **Rode as Migrations:**
    ```bash
    npm run typeorm:migration:run
    ```

6.  **Inicie o servidor:**
    ```bash
    npm run start:dev
    ```

## 🔐 Segurança: RBAC (Role-Based Access Control)

A segurança é controlada por Guards (`RolesGuard`) que leem metadados dos *decorators* `Roles()` nos *controllers*.

**Exemplo de uso:**
```typescript
// Somente usuários com o papel 'Admin' ou 'Manager_Reviewers' podem acessar este endpoint.
@Roles(Role.Admin, Role.Manager_Reviewers)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('tenants')
findAllTenants() {
  // ...
}
