import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GCC Web — servis AC dan elektronik rumah';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F4F1EA',
          color: '#101B17',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #101B17',
            paddingBottom: '22px',
            fontSize: 22,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ fontWeight: 700 }}>GCC Web</span>
          <span style={{ color: '#5B625D' }}>Servis AC &amp; elektronik rumah</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 82,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.045em',
              maxWidth: 950,
            }}
          >
            Servis AC, dingin lagi.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 29,
              lineHeight: 1.4,
              color: '#5B625D',
              maxWidth: 820,
            }}
          >
            Harga di depan. Jadwal bisa dipilih. Status pekerjaan bisa dilacak.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '2px solid #101B17',
            paddingTop: '22px',
            fontSize: 23,
          }}
        >
          <span style={{ fontWeight: 600 }}>gcc-web.id</span>
          <span style={{ color: '#5B625D' }}>
            Jakarta · Depok · Tangerang Selatan
          </span>
        </div>
      </div>
    ),
    size,
  );
}
