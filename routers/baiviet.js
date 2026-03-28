var express = require('express');
var router = express.Router();
var ChuDe = require('../models/chude');
var BaiViet = require('../models/baiviet');

// GET: Danh sách bài viết
router.get('/', async (req, res) => {
    try {
        var bv = await BaiViet.find()
            .populate('ChuDe')
            .populate('TaiKhoan').exec();
        res.render('baiviet', {
            title: 'Danh sách bài viết',
            baiviet: bv
        });
    } catch (error) {
        req.session.error = 'Lỗi tải danh sách bài viết.';
        res.redirect('/');
    }
});

// GET: Đăng bài viết
router.get('/them', async (req, res) => {
    if (!req.session.MaNguoiDung) {
        req.session.error = 'Vui lòng đăng nhập để đăng bài.';
        return res.redirect('/dangnhap');
    }
    try {
        var cd = await ChuDe.find();
        res.render('baiviet_them', {
            title: 'Đăng bài viết',
            chude: cd
        });
    } catch (error) {
        res.redirect('/error');
    }
});

// POST: Đăng bài viết
router.post('/them', async (req, res) => {
    if (!req.session.MaNguoiDung) return res.redirect('/dangnhap');
    
    try {
        var data = {
            ChuDe: req.body.MaChuDe,
            TaiKhoan: req.session.MaNguoiDung,
            TieuDe: req.body.TieuDe,
            TomTat: req.body.TomTat,
            NoiDung: req.body.NoiDung
        };
        await BaiViet.create(data);
        req.session.success = 'Đã đăng bài viết thành công và đang chờ kiểm duyệt.';
        res.redirect('/baiviet/cuatoi');
    } catch (error) {
        req.session.error = 'Đã xảy ra lỗi khi đăng bài.';
        res.redirect('/baiviet/them');
    }
});

// GET: Sửa bài viết (Hiển thị form)
router.get('/sua/:id', async (req, res) => {
    if (!req.session.MaNguoiDung) return res.redirect('/dangnhap');

    try {
        var id = req.params.id;
        var bv = await BaiViet.findById(id);

        if (bv.TaiKhoan.toString() !== req.session.MaNguoiDung && req.session.QuyenHan !== 'admin') {
            req.session.error = 'Bạn không có quyền sửa bài viết này!';
            return res.redirect('/baiviet/cuatoi');
        }

        // Lấy dữ liệu từ "Két sắt" ra cho người dùng sửa tiếp nếu có
        if (bv.TrangThaiSua === 1 && bv.BanNhap) {
            bv.TieuDe = bv.BanNhap.TieuDe;
            bv.TomTat = bv.BanNhap.TomTat;
            bv.NoiDung = bv.BanNhap.NoiDung;
            bv.ChuDe = bv.BanNhap.ChuDe;
        }

        var cd = await ChuDe.find();
        res.render('baiviet_sua', {
            title: 'Sửa bài viết',
            chude: cd,
            baiviet: bv
        });
    } catch (error) {
        res.redirect('/error');
    }
});

// POST: Sửa bài viết (Lưu dữ liệu)
router.post('/sua/:id', async (req, res) => {
    if (!req.session.MaNguoiDung) return res.redirect('/dangnhap');

    try {
        var id = req.params.id;
        var bv = await BaiViet.findById(id);

        if (bv.TaiKhoan.toString() !== req.session.MaNguoiDung && req.session.QuyenHan !== 'admin') {
            req.session.error = 'Bạn không có quyền sửa bài viết này!';
            return res.redirect('/baiviet');
        }

        if (bv.KiemDuyet === 1) {
            // NẾU BÀI ĐÃ DUYỆT: Cất vào Két sắt
            var data = {
                TrangThaiSua: 1, 
                BanNhap: {
                    ChuDe: req.body.MaChuDe,
                    TieuDe: req.body.TieuDe,
                    TomTat: req.body.TomTat,
                    NoiDung: req.body.NoiDung
                }
            };
            await BaiViet.findByIdAndUpdate(id, data);
            req.session.success = 'Đã lưu bản nháp! Vui lòng chờ Admin duyệt để cập nhật lên trang chủ.';
        } else {
            // NẾU BÀI CHƯA DUYỆT: Sửa thẳng
            var data = {
                ChuDe: req.body.MaChuDe,
                TieuDe: req.body.TieuDe,
                TomTat: req.body.TomTat,
                NoiDung: req.body.NoiDung
            };
            await BaiViet.findByIdAndUpdate(id, data);
            req.session.success = 'Đã cập nhật bài viết thành công.';
        }
        res.redirect('/baiviet/cuatoi');
    } catch (error) {
        req.session.error = 'Cập nhật thất bại.';
        res.redirect('/error');
    }
});

// GET: Xóa bài viết
router.get('/xoa/:id', async (req, res) => {
    if (!req.session.MaNguoiDung) return res.redirect('/dangnhap');

    try {
        var id = req.params.id;
        var bv = await BaiViet.findById(id);

        if (bv.TaiKhoan.toString() !== req.session.MaNguoiDung && req.session.QuyenHan !== 'admin') {
            req.session.error = 'Bạn không có quyền xóa bài viết này!';
            return res.redirect('back');
        }

        await BaiViet.findByIdAndDelete(id);
        req.session.success = 'Đã xóa bài viết thành công.';
        res.redirect('back');
    } catch (error) {
        res.redirect('/error');
    }
});

// GET: Duyệt bài viết (ĐÃ CẬP NHẬT CƠ CHẾ KÉT SẮT)
router.get('/duyet/:id', async (req, res) => {
    if (req.session.QuyenHan !== 'admin') {
        req.session.error = 'Chỉ Quản trị viên mới được duyệt bài!';
        return res.redirect('back');
    }

    try {
        var id = req.params.id;
        var bv = await BaiViet.findById(id);

        if (bv.TrangThaiSua === 1) {
            // Đang duyệt bản nháp
            var data = {
                ChuDe: bv.BanNhap.ChuDe,
                TieuDe: bv.BanNhap.TieuDe,
                TomTat: bv.BanNhap.TomTat,
                NoiDung: bv.BanNhap.NoiDung,
                TrangThaiSua: 0,
                BanNhap: null
            };
            await BaiViet.findByIdAndUpdate(id, data);
            req.session.success = 'Đã cập nhật BẢN SỬA MỚI NHẤT lên trang chủ.';
        } else {
            // Duyệt bài viết mới bình thường
            await BaiViet.findByIdAndUpdate(id, { 'KiemDuyet': 1 - bv.KiemDuyet });
            req.session.success = 'Đã thay đổi trạng thái kiểm duyệt.';
        }
        res.redirect('back');
    } catch (error) {
        res.redirect('/error');
    }
});

// GET: Danh sách bài viết của tôi
router.get('/cuatoi', async (req, res) => {
    if (!req.session.MaNguoiDung) {
        req.session.error = 'Vui lòng đăng nhập.';
        return res.redirect('/dangnhap');
    }
    
    try {
        var id = req.session.MaNguoiDung;
        var bv = await BaiViet.find({ TaiKhoan: id })
            .populate('ChuDe')
            .populate('TaiKhoan').exec();
        res.render('baiviet_cuatoi', {
            title: 'Bài viết của tôi',
            baiviet: bv
        });
    } catch (error) {
        res.redirect('/error');
    }
});

module.exports = router;