# Portal Lourdes Group

Portal akses cepat untuk karyawan ke seluruh website Lourdes Auto Parts, PT Garuda Mart Indonesia, dan PT Global Inti Sejati. Next.js (static export, tanpa backend).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # hasil statis di folder out/
npm start          # pratinjau folder out/
```

`npm run build` otomatis menjalankan:

- `npm run validate` memeriksa `src/data/content.json` (ID unik, kategori/departemen valid, file thumbnail ada).
- `npm run images` mengoptimasi gambar di `assets/source/` ke `public/img/` (AVIF/WebP berbagai ukuran + logo versi tema gelap).
- `npm run snapshot` menyimpan 30 Safety Topic terbaru dari globalinti.com (GIS) dan garudamart.com (GMI) sebagai cadangan. Di browser, data tetap diambil live.

## Admin konten (hanya localhost)

1. Jalankan `npm run dev`, buka http://localhost:3000.
2. Klik tombol **Admin** di header, lalu masukkan password.
3. Kelola **Tautan** (termasuk thumbnail: upload manual atau tombol *Screenshot*), **Departemen & Kategori**, **Perusahaan**, dan **Hero**.
4. Tekan **Simpan** (⌘S / Ctrl+S). Konten tersimpan ke `src/data/content.json`, thumbnail ke `assets/thumbs/`.
5. Terbitkan: `npm run build`, lalu deploy folder `out/`.

Keamanan:

- File admin bernama `*.dev.tsx` / `*.dev.ts` hanya dikenali saat `next dev` (lihat `next.config.ts`). Build produksi tidak berisi halaman maupun API admin sama sekali, sehingga `/admin` menjadi 404.
- API admin menolak request yang bukan dari `localhost` (termasuk dari IP jaringan kantor) dan request dari origin lain.
- Password disimpan sebagai hash scrypt + salt di `admin.config.json`. Ganti dengan `npm run admin:password -- "PasswordBaru"`.
- Sesi berlaku 8 jam dan otomatis berakhir saat `npm run dev` di-restart.

Screenshot otomatis memakai Google Chrome yang terpasang di komputer (lewat `playwright-core`). Situs yang tidak bisa dibuka dari komputer tersebut akan gagal, dan thumbnail-nya bisa di-upload manual.

## Deploy

Upload isi folder `out/` ke hosting statis apa pun (Vercel, Netlify, Cloudflare Pages, cPanel). Set `NEXT_PUBLIC_SITE_URL` ke domain portal agar pratinjau link (Open Graph) benar.

Build ulang secara berkala (misalnya harian lewat CI) supaya snapshot Safety Topic tetap segar. Ini opsional, karena data live tetap diambil di browser.
