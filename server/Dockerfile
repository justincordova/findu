FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Pull latest schema from database
RUN npx prisma db pull

# Generate Prisma client based on schema
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
