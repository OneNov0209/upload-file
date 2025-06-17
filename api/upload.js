const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  api: { bodyParser: false },
};

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

module.exports.default = async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      filename: (name, ext, part) =>
        Date.now() + '-' + part.originalFilename.replace(/\s+/g, '_'),
    });

    form.parse(req, (err, fields, files) => {
      if (
        fields.username !== process.env.ADMIN_USERNAME ||
        fields.password !== process.env.ADMIN_PASSWORD
      ) return res.status(401).json({ success: false, error: 'Unauthorized' });

      if (err || !files.file) {
        return res.status(500).json({ success: false, error: err?.message || 'Upload error' });
      }

      const uploadedFile = files.file[0];
      const fileUrl = `/uploads/${path.basename(uploadedFile.filepath)}`;
      res.status(200).json({ success: true, downloadUrl: fileUrl });
    });
  } else if (req.method === 'GET') {
    const files = fs.readdirSync(UPLOAD_DIR).map(file => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, file));
      return {
        name: file,
        size: stat.size,
        date: stat.mtime,
        url: `/uploads/${file}`,
      };
    });
    res.status(200).json({ files });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};
