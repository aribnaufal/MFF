# Medan Fashion Week 2027

Landing page editorial untuk **Medan Fashion Week 2027** — sebuah konsep pekan mode independen di Tjong A Fie Mansion, Kesawan, Medan.

Desain dibuat dari nol dengan arah visual yang berbeda dari Jakarta Fashion Week: palet warm bone, acid green, dan clay; tipografi Bricolage Grotesque + Instrument Serif; komposisi asimetris ala majalah mode; serta interaksi yang halus tanpa mengorbankan keterbacaan.

## Jalankan secara lokal

Website ini statis dan tidak membutuhkan build tool.

**Cara termudah:** buka `index.html` di browser.

Untuk pengalaman terbaik (font dan penyimpanan lokal berjalan optimal), gunakan server lokal:

```bash
python -m http.server 4173
```

Lalu buka:

```
http://127.0.0.1:4173
```

## Yang bisa dicoba

- **Lineup filter** — filter desainer berdasarkan kategori.
- **Profil desainer** — klik kartu untuk membuka dialog profil.
- **Jadwal interaktif** — pindah hari lewat tab, simpan sesi, dan unduh seluruh jadwal sebagai file `.ics`.
- **Journal** — buka catatan editorial dalam dialog baca.
- **Join the list** — validasi email dan status sukses.
- **Mobile menu** — navigasi layar penuh dengan focus trap dan tombol Escape.
- **Reduced motion** — animasi dimatikan bila pengguna memilih prefers-reduced-motion.

## Deploy ke Vercel

Project ini sudah disiapkan sebagai **static site** — tidak perlu build command.

### Lewat dashboard Vercel

1. Push folder ini ke GitHub/GitLab/Bitbucket.
2. Di Vercel, pilih **Add New → Project**, lalu import repository.
3. Gunakan pengaturan:
   - **Framework Preset:** Other
   - **Root Directory:** `.`
   - **Build Command:** kosongkan
   - **Output Directory:** `.`
4. Klik **Deploy**.

`vercel.json` sudah mengatur clean URL, cache aset gambar/font, dan header keamanan dasar. Halaman `404.html` juga otomatis dipakai Vercel untuk route yang tidak ditemukan.

### Lewat Vercel CLI

```bash
npx vercel@latest
npx vercel@latest --prod
```

### Setelah deploy

- Ganti `og:image` di `index.html` dengan URL absolut domain produksi, misalnya `https://domain-kamu.com/assets/img/hero.webp`.
- Cek halaman `/404` dan pastikan `/assets/img/hero.webp` terbuka normal.
- `preview/` dan `README.md` tidak ikut ter-deploy karena ada di `.vercelignore`.

## Struktur

```
index.html              Markup utama
styles.css              Design system + layout + responsive
app.js                  Interaksi, dialog, filter, kalender, form
404.html                Halaman error kustom untuk Vercel
vercel.json             Konfigurasi deploy, cache, dan security headers
robots.txt
assets/
  favicon.svg
  fonts/                Font Latin yang di-host lokal
  img/                  Foto final (WebP, sudah di-crop)
preview/                Tangkapan layar desktop, mobile, dan full-page
README.md
```

## Konten & kredit

- Nama desainer, jadwal, dan narasi program adalah **konten konsep** untuk kebutuhan presentasi desain.
- Foto mode: [Pexels](https://www.pexels.com/) contributors, digunakan sesuai Pexels License.
- Foto Tjong A Fie Mansion: **Pratyeka / Wikimedia Commons**, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Font: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque), [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), [DM Mono](https://fonts.google.com/specimen/DM+Mono) — SIL Open Font License.

Proyek ini adalah konsep independen dan tidak berafiliasi dengan Jakarta Fashion Week atau penyelenggara Medan Fashion Week yang ada.
