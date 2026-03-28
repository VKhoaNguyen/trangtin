var mongoose = require('mongoose');

const baiVietSchema = new mongoose.Schema({
    ChuDe: { type: mongoose.Schema.Types.ObjectId, ref: 'ChuDe' },
    TaiKhoan: { type: mongoose.Schema.Types.ObjectId, ref: 'TaiKhoan' },
    TieuDe: { type: String, required: true },
    TomTat: { type: String, required: true },
    NoiDung: { type: String, required: true },
    NgayDang: { type: Date, default: Date.now },
    LuotXem: { type: Number, default: 0 },
    KiemDuyet: { type: Number, default: 0 }, // <-- Đã thêm dấu phẩy ở đây
    
    // ======== CODE MỚI THÊM ========
    // 0: Bình thường, 1: Đang có bản nháp chờ duyệt
    TrangThaiSua: { type: Number, default: 0 }, 
    
    // Két sắt chứa nội dung sửa tạm thời
    BanNhap: {
        ChuDe: { type: mongoose.Schema.Types.ObjectId, ref: 'ChuDe' },
        TieuDe: String,
        TomTat: String,
        NoiDung: String
    }
    // ================================
}); // <-- Dấu ngoặc đóng nằm tuốt ở cuối cùng này mới đúng

var baiVietModel = mongoose.model('BaiViet', baiVietSchema);
module.exports = baiVietModel;