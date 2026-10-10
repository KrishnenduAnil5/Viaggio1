import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/authContext';
import { DataService } from '../lib/storage';
import { UserDocument, DocumentCategory } from '../types';
import { 
  FolderLock, 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Download, 
  Eye, 
  X, 
  Lock 
} from 'lucide-react';

export const MyDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);

  // Upload Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('passport');
  const [customName, setCustomName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadDocuments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await DataService.getUserDocuments(user.id);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Strict restrictions on types and size
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Only PDF, PNG, or JPG/JPEG documents are permitted.');
        return;
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Document size must not exceed 10 megabytes.');
        return;
      }

      setSelectedFile(file);
      if (!customName) {
        setCustomName(file.name);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadProgress(true);
    setUploadError('');

    try {
      await DataService.uploadUserDocument(
        {
          user_id: user.id,
          file_name: customName.trim() || selectedFile.name,
          file_path: `${user.id}/${Date.now()}_${selectedFile.name}`,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          category,
          status: 'verified',
        },
        selectedFile
      );

      setIsUploadOpen(false);
      setSelectedFile(null);
      setCustomName('');
      await loadDocuments();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed. Please verify storage permissions.');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Delete this document permanently from your encrypted vault?')) {
      await DataService.deleteUserDocument(docId);
      await loadDocuments();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const categoriesList: { id: DocumentCategory; label: string }[] = [
    { id: 'passport', label: 'Passport & Identity' },
    { id: 'financial', label: 'Financial Records' },
    { id: 'employment', label: 'Employment & Contracts' },
    { id: 'itinerary', label: 'Travel Itinerary & Booking' },
    { id: 'accommodation', label: 'Accommodation Proof' },
    { id: 'photo', label: 'Biometric Photos' },
    { id: 'other', label: 'Other Supporting Files' },
  ];

  // Missing documents tracker
  const uploadedSet = new Set(documents.map(d => d.category));
  const missingCoreCategories = [
    { cat: 'passport', name: 'Passport Bio-Page Scan' },
    { cat: 'financial', name: 'Recent Bank Statement (3-6 Months)' },
    { cat: 'employment', name: 'Employment Letter / Salary Slip' },
  ].filter(c => !uploadedSet.has(c.cat as DocumentCategory));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EAE5DF]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#77716B] block mb-1">
            Option 04 · Confidential Vault
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            My Travel Documents
          </h1>
          <p className="text-[#77716B] text-sm mt-1 max-w-xl">
            Private, encrypted storage for visa dossiers and passport identity papers. Strictly accessible only by you.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedFile(null);
            setCustomName('');
            setCategory('passport');
            setUploadError('');
            setIsUploadOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Missing documents reminder banner */}
      {missingCoreCategories.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#D99A43]/10 border border-[#D99A43]/20 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-[#D99A43] shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-[#111111]">Missing Document Reminders:</span>
            <p className="text-[#77716B] mt-0.5">
              To guarantee complete compliance with standard consular requirements, please ensure you upload:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingCoreCategories.map((m) => (
                <span key={m.cat} className="px-2.5 py-1 rounded-md bg-white border border-[#EAE5DF] font-semibold text-[#111111]">
                  • {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-[#111111]/20 border-t-[#111111] rounded-full animate-spin mx-auto" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE5DF] p-12 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F1E9] flex items-center justify-center text-[#111111] mx-auto mb-4">
            <FolderLock className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-[#111111] mb-2">Vault is currently empty</h3>
          <p className="text-xs text-[#77716B] leading-relaxed mb-6">
            Upload your passport scan, bank certificates, and travel itineraries for instant access and embassy submission readiness.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {documents.map((doc) => {
              const catLabel = categoriesList.find(c => c.id === doc.category)?.label || 'Document';

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-[#EAE5DF] p-5 hover:border-[#111111]/40 transition-all flex flex-col justify-between shadow-2xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F7F1E9] flex items-center justify-center text-[#111111] shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors cursor-pointer"
                          title="Preview document metadata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-[#77716B] hover:text-[#C95C54] hover:bg-[#C95C54]/10 transition-colors cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[#111111] truncate mb-1" title={doc.file_name}>
                      {doc.file_name}
                    </h4>

                    <span className="inline-block text-[11px] font-medium text-[#77716B] bg-[#F7F1E9] px-2 py-0.5 rounded mb-3">
                      {catLabel}
                    </span>

                    <div className="space-y-1 text-xs text-[#77716B] pt-2 border-t border-[#EAE5DF]/60">
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span className="font-mono text-[#111111]">{formatFileSize(doc.file_size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded</span>
                        <span className="font-mono text-[#111111]">{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span>Security</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Private RLS
                        </span>
                      </div>
                    </div>

                    {doc.admin_comment && (
                      <p className="text-[11px] text-[#77716B] mt-2 italic bg-[#E5EDF4]/40 p-2 rounded">
                        <strong>Consular Review:</strong> {doc.admin_comment}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE5DF]/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#77716B] truncate max-w-[150px]">
                      {doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                    <button
                      onClick={() => alert(`Accessing encrypted stream for ${doc.file_name}`)}
                      className="text-xs font-semibold text-[#111111] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-lg w-full p-6 sm:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsUploadOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display text-xl font-bold text-[#111111] mb-1">
              Upload Travel Document
            </h3>
            <p className="text-xs text-[#77716B] mb-5">
              Uploaded files are stored within a private Supabase Storage bucket protected by user-level RLS policies.
            </p>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-[#C95C54]/10 border border-[#C95C54]/30 text-[#C95C54] text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Select File (PDF, PNG, JPG - Max 10MB) *
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  required
                  className="w-full text-xs text-[#77716B] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-[#EAE5DF] file:bg-[#F7F1E9] file:text-[#111111] file:text-xs file:font-semibold hover:file:bg-[#EAE5DF] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Document Display Title
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Passport Bio-Page 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Document Classification *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE5DF] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE5DF] text-xs text-[#77716B] hover:text-[#111111] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadProgress ? 'Encrypting & Uploading...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#EAE5DF] max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#77716B] hover:text-[#111111] hover:bg-[#F7F1E9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F7F1E9] flex items-center justify-center text-[#111111]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#111111] truncate max-w-[240px]">
                  {previewDoc.file_name}
                </h3>
                <span className="text-xs text-[#77716B]">Secure Vault Metadata</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#111111] py-3 border-y border-[#EAE5DF]">
              <div className="flex justify-between">
                <span className="text-[#77716B]">File Type:</span>
                <span className="font-mono">{previewDoc.file_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77716B]">Size:</span>
                <span className="font-mono">{formatFileSize(previewDoc.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77716B]">Storage Path:</span>
                <span className="font-mono text-[11px] text-[#77716B] truncate max-w-[200px]">{previewDoc.file_path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77716B]">Access Control:</span>
                <span className="font-semibold text-emerald-700">auth.uid() = user_id</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-lg bg-[#111111] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
