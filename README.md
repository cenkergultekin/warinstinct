# warinstinct

Günlük karşılıklı görsel + tek cümle paylaşım alanı (`warinstinct.vercel.app`).

## Mimari Şema

```text
Browser (public/index.html)
  ├── İstemci tarafında görseli WebP'ye dönüştürür (Canvas)
  ├── GET  /api/today?user=onur|cenker  ──► Vercel Serverless Function
  └── POST /api/drop                    ──► Vercel Serverless Function
                                                  │
                                                  ▼
                                         Vercel Blob Storage
                                         ├── drops/<user>/<YYYY-MM-DD>.webp
                                         └── meta/<user>.json
```

### Kurallar
- **Günlük Sıfırlama (`Europe/Istanbul`):** `/api/today` yalnızca bugünün (`YYYY-MM-DD`) paylaşımını döner; önceki günler ana ekranda görünmez.
- **Karşılıklı Gizlilik:** Karşı tarafın klasörü tıklanınca yana doğru açılır; kendi klasörün varsayılan olarak gizlidir, göz ikonu ile açılır.
- **7. Gün (24 Saatlik Grid):** İlk paylaşımdan itibaren tam 7., 14., 21. günlerde yalnızca o 24 saat boyunca 7 günlük grid butonu görünür ve tek `.webp` olarak indirilebilir; ertesi gün otomatik kaybolur.

## Kurulum & Canlıya Alma (Vercel)

1. Vercel Dashboard → **warinstinct** projesi → **Storage → Create Database → Blob** seçip projeye bağla (`BLOB_READ_WRITE_TOKEN` otomatik eklenir).
2. `main` branch'ine yapılan her push otomatik olarak `warinstinct.vercel.app` adresine deploy edilir.

## Açık Repo & `main` Push Yetkisi

- Repo herkese açık (`public`) tutulabilir; hiçbir gizli anahtar repoda yer almaz (`BLOB_READ_WRITE_TOKEN` sadece Vercel Environment Variables içindedir).
- Onay verdiğin kişiye `main`'e push yetkisi vermek için:
  - GitHub → **Settings → Collaborators → Add people** (veya `gh api -X PUT repos/cenkergultekin/warinstinct/collaborators/<github-kullanici-adi> -f permission=push`).
