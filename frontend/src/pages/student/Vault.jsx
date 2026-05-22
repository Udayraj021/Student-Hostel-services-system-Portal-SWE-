import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Upload, Trash2, Download } from 'lucide-react';

export default function Vault() {
  const [files, setFiles] = useState(null);
  const [file, setFile] = useState(null);

  async function load() { const r = await api.get('/vault'); setFiles(r.data); }
  useEffect(() => { load(); }, []);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/vault/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Uploaded');
      setFile(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function remove(id) {
    if (!confirm('Delete this file?')) return;
    await api.delete('/vault/' + id); load();
  }

  if (!files) return <Loading />;

  return (
    <>
      <PageHeader title="Document Vault" subtitle="Secure storage for your proofs, certificates and documents." />
      <Card title="Upload a file" description="Max size 10 MB. All file types supported.">
        <form onSubmit={upload} className="flex flex-wrap items-end gap-3">
          <input type="file" onChange={e => setFile(e.target.files[0])} className="input sm:max-w-xs" />
          <button disabled={!file} className="btn-primary"><Upload size={14} /> Upload</button>
        </form>
      </Card>
      <div className="mt-6">
        <Card title="My Documents">
          {files.length === 0 ? <Empty title="No documents yet" /> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
                <tbody>
                  {files.map(f => (
                    <tr key={f.file_id}>
                      <td className="font-medium">{f.file_name}</td>
                      <td>{f.file_type}</td>
                      <td>{f.size_kb} KB</td>
                      <td>{new Date(f.uploaded_at).toLocaleString()}</td>
                      <td className="flex justify-end gap-2">
                        <a href={f.file_url} target="_blank" rel="noreferrer" className="btn-secondary btn-sm"><Download size={12} /></a>
                        <button onClick={() => remove(f.file_id)} className="btn-danger btn-sm"><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
