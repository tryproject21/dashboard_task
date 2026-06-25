'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Image as ImageIcon } from 'lucide-react';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

export default function ReportBuilder({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  
  const [title, setTitle] = useState(meeting.title || '');
  const [dateStr, setDateStr] = useState(new Date(meeting.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }));
  const [location, setLocation] = useState(meeting.link || '');
  const [attendees, setAttendees] = useState('');
  const [agenda, setAgenda] = useState('');
  const [results, setResults] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setPhotos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="report-builder-container">
      <div className="report-header flex-between mb-4 no-print">
        <div className="flex-center gap-4">
          <button className="btn-icon" onClick={() => router.push('/schedule')}><ArrowLeft size={20}/></button>
          <div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Laporan Kegiatan</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generator laporan format resmi.</p>
          </div>
        </div>
        <div className="flex-center gap-2">
          <button className="btn btn-primary" onClick={handleExportPDF} style={{ background: '#10b981', border: 'none' }}>
            <Download size={16}/> Cetak / Export PDF
          </button>
        </div>
      </div>

      <div className="report-grid">
        {/* Left Column: Data Input */}
        <div className="glass-panel input-section no-print">
          <h3 className="mb-4">Isi Data Laporan</h3>
          
          <div className="input-group">
            <label className="input-label">Judul Kegiatan</label>
            <input type="text" className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Waktu Pelaksanaan</label>
            <input type="text" className="input-field" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Tempat / Platform</label>
            <input type="text" className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Ruang Rapat / Zoom" />
          </div>

          <div className="input-group">
            <label className="input-label">Daftar Hadir (Peserta)</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="1. Bapak A&#10;2. Ibu B" 
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Agenda / Topik Pembahasan</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="Tulis agenda rapat di sini..." 
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Hasil Kegiatan / Notulensi</label>
            <textarea 
              className="input-field" 
              rows={6} 
              placeholder="Tulis hasil keputusan dan diskusi di sini..." 
              value={results}
              onChange={(e) => setResults(e.target.value)}
            />
          </div>

          <div className="input-group mt-4">
            <label className="input-label flex-between">
              <span>Foto Kegiatan / Dokumentasi</span>
              <label className="btn btn-secondary text-xs" style={{ cursor: 'pointer', padding: '4px 8px' }}>
                <ImageIcon size={14} style={{ marginRight: '4px' }}/> Tambah Foto
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </label>
            </label>
            
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <img src={p} alt="Dokumentasi" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                    <button 
                      onClick={() => handleRemovePhoto(i)}
                      style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview/Editor (Printable Area) */}
        <div className="glass-panel preview-section print-only-container">
          <div className="formal-report-paper">
            <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '2px solid black', paddingBottom: '10px' }}>
              Laporan Hasil Kegiatan
            </h2>
            
            <table className="formal-table">
              <tbody>
                <tr>
                  <td className="col-label">1. Nama Kegiatan</td>
                  <td className="col-colon">:</td>
                  <td className="col-content"><strong>{title}</strong></td>
                </tr>
                <tr>
                  <td className="col-label">2. Waktu Pelaksanaan</td>
                  <td className="col-colon">:</td>
                  <td className="col-content">{dateStr}</td>
                </tr>
                <tr>
                  <td className="col-label">3. Tempat</td>
                  <td className="col-colon">:</td>
                  <td className="col-content">{location || '-'}</td>
                </tr>
                <tr>
                  <td className="col-label" style={{ verticalAlign: 'top' }}>4. Daftar Hadir</td>
                  <td className="col-colon" style={{ verticalAlign: 'top' }}>:</td>
                  <td className="col-content" style={{ whiteSpace: 'pre-wrap' }}>{attendees || '-'}</td>
                </tr>
                <tr>
                  <td className="col-label" style={{ verticalAlign: 'top' }}>5. Agenda Pembahasan</td>
                  <td className="col-colon" style={{ verticalAlign: 'top' }}>:</td>
                  <td className="col-content" style={{ whiteSpace: 'pre-wrap' }}>{agenda || '-'}</td>
                </tr>
                <tr>
                  <td className="col-label" style={{ verticalAlign: 'top' }}>6. Hasil Kegiatan</td>
                  <td className="col-colon" style={{ verticalAlign: 'top' }}>:</td>
                  <td className="col-content" style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{results || '-'}</td>
                </tr>
                <tr>
                  <td className="col-label" style={{ verticalAlign: 'top' }}>7. Dokumentasi</td>
                  <td className="col-colon" style={{ verticalAlign: 'top' }}>:</td>
                  <td className="col-content">
                    {photos.length === 0 ? '-' : (
                      <div className="photo-grid">
                        {photos.map((p, i) => (
                          <img key={i} src={p} alt="Dokumentasi" className="report-photo" />
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .report-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          height: calc(100vh - 150px);
        }
        .input-section {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .preview-section {
          padding: 24px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: #f3f4f6; /* grey background to make paper pop */
        }
        [data-theme='dark'] .preview-section {
          background: #111827;
        }

        .formal-report-paper {
          background: white;
          color: black;
          padding: 40px;
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          min-height: 800px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
        }

        .formal-table {
          width: 100%;
          border-collapse: collapse;
        }

        .formal-table td {
          padding: 8px 4px;
        }

        .col-label {
          width: 25%;
          font-weight: 500;
        }

        .col-colon {
          width: 2%;
          text-align: center;
        }

        .col-content {
          width: 73%;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 8px;
        }

        .report-photo {
          width: 100%;
          height: auto;
          max-height: 250px;
          object-fit: contain;
          border: 1px solid #ddd;
          padding: 4px;
        }

        /* Print Styles */
        @media print {
          @page {
            margin: 20mm;
            size: A4 portrait;
          }
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .print-only-container, .print-only-container * {
            visibility: visible;
          }
          .print-only-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .formal-report-paper {
            padding: 0;
            box-shadow: none;
            min-height: auto;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
