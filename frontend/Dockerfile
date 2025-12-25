# Estágio 1: Build da aplicação Angular
FROM node:20-slim AS build

WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm ci

# Copia o código fonte
COPY . .

# Gera os arquivos de produção (dist)
RUN npm run build

# Estágio 2: Servidor Nginx para servir os arquivos estáticos
FROM nginx:alpine

# Copia os arquivos compilados do estágio de build para o diretório do Nginx
# NOTA: Verifica se o nome da pasta em dist/ é 'allrev-frontend' (está no angular.json)
COPY --from=build /app/dist/allrev-frontend/browser /usr/share/nginx/html

# Copia uma configuração customizada do Nginx (opcional, mas recomendado para SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
