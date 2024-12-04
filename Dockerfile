# Gunakan image Node.js sebagai base image
FROM node:16

# Setel direktori kerja di dalam container
WORKDIR /src

# Salin package.json dan package-lock.json ke dalam container
COPY package*.json ./

# Install dependensi aplikasi
RUN npm install

# Salin seluruh kode aplikasi ke dalam container
COPY . .

# Expose port yang digunakan aplikasi
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["node", "src/app.js"]
