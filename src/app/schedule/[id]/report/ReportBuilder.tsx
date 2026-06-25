'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, UploadCloud, X, Calendar, Type, BookOpen, MapPin } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { compressImage } from '@/lib/imageCompressor';

type Meeting = {
  id: string;
  title: string;
  date: string;
  link: string;
};

type DocImage = {
  id: string;
  src: string;
  caption: string;
};

export default function ReportBuilder({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  
  const [reportData, setReportData] = useState({
    perihal: meeting.title || '',
    tanggal: meeting.date ? meeting.date.split('T')[0] : '',
    tanggalAkhir: '',
    lokasi: meeting.link || '',
    notulensi: '',
    dokumentasi: [] as DocImage[]
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReportData(prev => ({ ...prev, [name]: value }));
  };

  const processFiles = async (files: FileList | File[]) => {
    const newImages: DocImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const compressedBase64 = await compressImage(file);
          newImages.push({
            id: Date.now() + i + Math.random().toString(36).substr(2, 5),
            src: compressedBase64,
            caption: ''
          });
        } catch (error) {
          console.error("Error compressing image", error);
        }
      }
    }
    if (newImages.length > 0) {
      setReportData(prev => ({
        ...prev,
        dokumentasi: [...prev.dokumentasi, ...newImages]
      }));
    }
  };

  const handleDropFile = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setReportData(prev => ({
      ...prev,
      dokumentasi: prev.dokumentasi.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleCaptionChange = (index: number, value: string) => {
    setReportData(prev => {
      const newDocs = [...prev.dokumentasi];
      newDocs[index].caption = value;
      return { ...prev, dokumentasi: newDocs };
    });
  };

  // Drag and drop for reordering images
  const handleDragStartItem = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    setReportData(prev => {
      const newDocs = [...prev.dokumentasi];
      const draggedItem = newDocs[draggedItemIndex];
      newDocs.splice(draggedItemIndex, 1);
      newDocs.splice(dropIndex, 0, draggedItem);
      return { ...prev, dokumentasi: newDocs };
    });
    setDraggedItemIndex(null);
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    const element = reportRef.current;
    
    const opt = {
      margin:       20, 
      filename:     `Laporan_Kegiatan_${reportData.tanggal || 'Untitled'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        letterRendering: true 
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] }
    };

    try {
      await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(120);
            pdf.text(
              `Halaman ${i} dari ${totalPages}`,
              pdf.internal.pageSize.getWidth() - 20,
              pdf.internal.pageSize.getHeight() - 10,
              { align: 'right' }
            );
          }
        })
        .save();
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Terjadi kesalahan saat menghasilkan PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const displayDate = () => {
    if (!reportData.tanggal) return '-';
    const startDate = formatDate(reportData.tanggal);
    if (reportData.tanggalAkhir) {
      return `${startDate} s/d ${formatDate(reportData.tanggalAkhir)}`;
    }
    return startDate;
  };

  const isFormValid = reportData.perihal && reportData.tanggal && reportData.lokasi;

  return (
    <div className="report-app-container">
      <div className="flex-between w-full mb-4" style={{ padding: '0 32px' }}>
         <button className="btn-icon" onClick={() => router.push('/schedule')}><ArrowLeft size={20}/> Back</button>
      </div>
      <div className="app-container-inner">
        {/* Left Panel: Form Input */}
        <div className="left-panel glass-panel">
          <h1 className="form-title">Generator Laporan</h1>
          <p className="form-subtitle">Lengkapi data di bawah ini untuk membuat laporan kegiatan.</p>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Type size={16} /> Perihal
            </label>
            <input
              type="text"
              name="perihal"
              className="form-input"
              placeholder="Misal: Rapat Evaluasi Program Kerja"
              value={reportData.perihal}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} /> Tanggal Kegiatan
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="date"
                name="tanggal"
                className="form-input"
                style={{ flex: 1 }}
                value={reportData.tanggal}
                onChange={handleInputChange}
              />
              <span style={{ color: 'var(--text-secondary)' }}>s/d</span>
              <input
                type="date"
                name="tanggalAkhir"
                className="form-input"
                style={{ flex: 1 }}
                value={reportData.tanggalAkhir}
                onChange={handleInputChange}
                title="Opsional: Kosongkan jika hanya 1 hari"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} /> Lokasi Kegiatan
            </label>
            <input
              type="text"
              name="lokasi"
              className="form-input"
              placeholder="Misal: Ruang Rapat Utama"
              value={reportData.lokasi}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} /> Notulensi (Opsional)
            </label>
            <textarea
              name="notulensi"
              className="form-textarea"
              placeholder="Tuliskan catatan atau hasil rapat kegiatan di sini..."
              value={reportData.notulensi}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dokumentasi (Unggah & Geser Foto)</label>
            <div 
              className={`file-upload-area ${isDraggingFile ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
              onDrop={handleDropFile}
            >
              <UploadCloud className="file-upload-icon" size={36} />
              <p style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 500 }}>
                Tarik & Lepas foto ke sini
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                atau klik untuk memilih file (Bisa lebih dari 1)
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="file-upload-input"
                onChange={handleFileSelect}
              />
            </div>

            {reportData.dokumentasi.length > 0 && (
              <div className="image-preview-list">
                {reportData.dokumentasi.map((doc, index) => (
                  <div 
                    key={doc.id} 
                    className={`image-preview-item ${draggedItemIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStartItem(e, index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropItem(e, index)}
                    onDragEnd={() => setDraggedItemIndex(null)}
                  >
                    <div className="image-preview-img-wrapper">
                      <img src={doc.src} alt={`Dokumentasi ${index + 1}`} />
                      <button 
                        type="button"
                        className="remove-image-btn" 
                        onClick={() => removeImage(index)}
                        title="Hapus gambar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="caption-input" 
                      placeholder="Keterangan foto (opsional)..."
                      value={doc.caption}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={generatePDF} 
              className="btn-primary-gen" 
              style={{ flex: 2 }}
              disabled={!isFormValid || isGenerating}
            >
              {isGenerating ? (
                <><Loader2 className="animate-spin" size={20} /> Memproses PDF...</>
              ) : (
                <><Download size={20} /> Unduh PDF</>
              )}
            </button>
          </div>
          {!isFormValid && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center' }}>
              * Mohon lengkapi Perihal, Tanggal, dan Lokasi untuk mengunduh PDF.
            </p>
          )}
        </div>

        {/* Right Panel: Live Preview */}
        <div className="right-panel">
          <div className="pdf-preview-wrapper">
            <div ref={reportRef} className="pdf-document">
              
              <div className="page-separator-overlay" data-html2canvas-ignore="true"></div>

              <div className="pdf-header">
                <h1 className="pdf-title">LAPORAN KEGIATAN</h1>
              </div>

              <div className="pdf-content-section">
                <div className="pdf-row">
                  <div className="pdf-label">Perihal</div>
                  <div className="pdf-value">: {reportData.perihal || '-'}</div>
                </div>
                <div className="pdf-row">
                  <div className="pdf-label">Tanggal Kegiatan</div>
                  <div className="pdf-value">: {displayDate()}</div>
                </div>
                <div className="pdf-row">
                  <div className="pdf-label">Lokasi</div>
                  <div className="pdf-value">: {reportData.lokasi || '-'}</div>
                </div>
              </div>

              {reportData.notulensi && (
                <div className="pdf-content-section" style={{ pageBreakInside: 'avoid' }}>
                  <h2 className="pdf-section-title">Notulensi</h2>
                  <div className="pdf-value" style={{ textAlign: 'justify' }}>
                    {reportData.notulensi}
                  </div>
                </div>
              )}

              {reportData.dokumentasi.length > 0 && (
                <div className="pdf-content-section">
                  <h2 className="pdf-section-title" style={{ marginTop: '20px' }}>Dokumentasi Kegiatan</h2>
                  <div className="pdf-doc-grid">
                    {reportData.dokumentasi.map((doc, index) => (
                      <div key={doc.id || index} className="pdf-doc-item">
                        <img src={doc.src} alt={`Dokumentasi ${index + 1}`} />
                        {doc.caption && (
                          <div className="pdf-doc-caption">
                            {doc.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .report-app-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
        }

        .app-container-inner {
          display: flex;
          gap: 24px;
          height: 100%;
          overflow: hidden;
        }

        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 32px;
          border-radius: 16px;
        }

        .right-panel {
          flex: 1.2;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          padding: 32px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }

        .form-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .form-subtitle {
          color: var(--text-secondary);
          margin-bottom: 32px;
          font-size: 0.95rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 24px;
        }

        .form-label {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input, .form-textarea {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        [data-theme='light'] .form-input, [data-theme='light'] .form-textarea {
          background: rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .form-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .file-upload-area {
          border: 2px dashed rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(0,0,0,0.2);
          position: relative;
        }
        [data-theme='light'] .file-upload-area {
          border-color: rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.5);
        }

        .file-upload-area:hover, .file-upload-area.drag-active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .file-upload-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .file-upload-icon {
          color: var(--text-secondary);
          margin-bottom: 12px;
          margin-left: auto;
          margin-right: auto;
        }

        .image-preview-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .image-preview-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0, 0, 0, 0.1);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          cursor: grab;
          transition: all 0.2s;
        }

        .image-preview-item.dragging {
          opacity: 0.5;
          border-color: #3b82f6;
          transform: scale(0.98);
        }

        .image-preview-img-wrapper {
          position: relative;
          width: 100%;
          height: 150px;
          border-radius: 6px;
          overflow: hidden;
          background: rgba(0,0,0,0.3);
        }

        .image-preview-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .caption-input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.9rem;
          width: 100%;
        }

        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(239, 68, 68, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-primary-gen {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
        }
        .btn-primary-gen:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pdf-preview-wrapper {
          background: #ffffff;
          color: #0f172a;
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          transform-origin: top center;
          transform: scale(0.85); 
          margin: 0 auto;
        }

        @media (max-width: 1400px) {
          .pdf-preview-wrapper {
            transform: scale(0.7);
          }
        }

        .pdf-document {
          position: relative;
          width: 100%;
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          background: #ffffff;
        }

        .page-separator-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent calc(297mm - 4px),
            #ef4444 calc(297mm - 4px),
            #ef4444 297mm
          );
          z-index: 50;
          opacity: 0.6;
        }

        .pdf-header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }

        .pdf-title {
          font-size: 24pt;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .pdf-content-section {
          margin-bottom: 30px;
        }

        .pdf-row {
          display: flex;
          margin-bottom: 15px;
          font-size: 12pt;
          line-height: 1.6;
        }

        .pdf-label {
          font-weight: bold;
          width: 150px;
          flex-shrink: 0;
        }

        .pdf-value {
          flex-grow: 1;
          white-space: pre-wrap;
        }

        .pdf-section-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }

        .pdf-doc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          margin-top: 20px;
        }

        .pdf-doc-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .pdf-doc-item img {
          width: 100%;
          height: auto;
          object-fit: contain;
          border: 1px solid #ddd;
          max-height: 600px;
        }

        .pdf-doc-caption {
          margin-top: 8px;
          font-size: 11pt;
          font-style: italic;
          text-align: center;
          color: #333;
        }

        .html2pdf__page-break {
          height: 0;
          page-break-before: always;
          margin: 0;
          padding: 0;
          border: none;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
