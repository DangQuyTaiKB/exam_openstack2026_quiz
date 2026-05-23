// Chạy một lần để tạo file đề thi mẫu: node generate-exam.js
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType
} = require("docx");
const fs = require("fs");
const path = require("path");
const cfg = require("./config");

async function createExam() {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Tiêu đề
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: cfg.EXAM_TITLE || "BÀI THI THỰC HÀNH", bold: true, size: 28, color: "1a1a18" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: cfg.SESSION_NAME || "Kỳ thi thực hành", size: 24, color: "555555" })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: `Thời gian: ${cfg.PRACTICAL_DURATION_MINUTES || 90} phút`, size: 22, italics: true, color: "666666" })]
        }),

        // Thông tin học viên
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "Họ và tên: ", bold: true, size: 22 }),
            new TextRun({ text: "_____________________________________________", size: 22, color: "888888" }),
          ]
        }),
        new Paragraph({
          spacing: { after: 400 },
          children: [
            new TextRun({ text: "Mã học viên: ", bold: true, size: 22 }),
            new TextRun({ text: "______________   ", size: 22, color: "888888" }),
            new TextRun({ text: "  Ngày thi: ", bold: true, size: 22 }),
            new TextRun({ text: new Date().toLocaleDateString("vi-VN"), size: 22, color: "888888" }),
          ]
        }),

        // Đường kẻ ngang
        new Paragraph({
          spacing: { after: 400 },
          border: { bottom: { color: "cccccc", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          children: []
        }),

        // Yêu cầu chung
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 160 },
          children: [new TextRun({ text: "YÊU CẦU CHUNG", bold: true, size: 24, color: "1a1a18" })]
        }),
        ...["Đọc kỹ đề trước khi làm bài.",
            "Thực hiện từng bước theo hướng dẫn và chụp màn hình (screenshot) kết quả.",
            "Đặt tên file nộp bài theo định dạng: HoTen_BaiThi.zip (ví dụ: NguyenVanAn_BaiThi.zip).",
            "Nộp bài qua hệ thống trước khi hết giờ."
        ].map((text, i) => new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `${i+1}. ${text}`, size: 22 })]
        })),

        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // Bài 1
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "BÀI 1: CẤU HÌNH MẠNG CƠ BẢN (3 điểm)", bold: true, size: 24, color: "1d4ed8" })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Thực hiện các bước sau và chụp màn hình từng bước:", size: 22 })]
        }),
        ...["Mở cửa sổ Command Prompt với quyền Administrator.",
            "Gõ lệnh ipconfig /all và chụp màn hình toàn bộ kết quả.",
            "Thực hiện lệnh ping 8.8.8.8 -n 4 và chụp màn hình kết quả.",
            "Gõ lệnh netstat -an | findstr LISTENING và chụp màn hình.",
        ].map((text, i) => new Paragraph({
          spacing: { after: 100 },
          indent: { left: 400 },
          children: [new TextRun({ text: `Bước ${i+1}: ${text}`, size: 22 })]
        })),

        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "📋 Kết quả cần nộp: ", bold: true, size: 22, color: "15803d" }),
          new TextRun({ text: "3 ảnh screenshot đặt tên bai1_buoc1.png, bai1_buoc2.png, bai1_buoc3.png", size: 22 })
        ]}),

        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // Bài 2
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "BÀI 2: QUẢN LÝ FILE VÀ THƯ MỤC (3 điểm)", bold: true, size: 24, color: "1d4ed8" })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Sử dụng Command Prompt hoặc PowerShell:", size: 22 })]
        }),
        ...["Tạo thư mục C:\\BaiThi\\HoTen (thay HoTen bằng tên của bạn).",
            "Trong thư mục đó, tạo 3 file text: data1.txt, data2.txt, data3.txt.",
            "Ghi nội dung vào data1.txt bằng lệnh: echo Noi dung bai thi > data1.txt",
            "Liệt kê nội dung thư mục bằng lệnh dir và chụp màn hình.",
            "Nén toàn bộ thư mục thành file .zip.",
        ].map((text, i) => new Paragraph({
          spacing: { after: 100 },
          indent: { left: 400 },
          children: [new TextRun({ text: `Bước ${i+1}: ${text}`, size: 22 })]
        })),

        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "📋 Kết quả cần nộp: ", bold: true, size: 22, color: "15803d" }),
          new TextRun({ text: "1 ảnh screenshot lệnh dir + file zip thư mục BaiThi", size: 22 })
        ]}),

        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // Bài 3
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "BÀI 3: CÀI ĐẶT VÀ KIỂM TRA DỊCH VỤ (4 điểm)", bold: true, size: 24, color: "1d4ed8" })]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: "Thực hiện theo hướng dẫn dưới đây:", size: 22 })]
        }),
        ...["Kiểm tra trạng thái Windows Firewall bằng lệnh: netsh advfirewall show allprofiles",
            "Chụp màn hình kết quả và ghi nhận trạng thái (ON/OFF) của từng profile.",
            "Mở Task Manager, vào tab Services, chụp màn hình danh sách services đang chạy.",
            "Dùng lệnh systeminfo và chụp màn hình phần OS Name, OS Version, Total Physical Memory.",
        ].map((text, i) => new Paragraph({
          spacing: { after: 100 },
          indent: { left: 400 },
          children: [new TextRun({ text: `Bước ${i+1}: ${text}`, size: 22 })]
        })),

        new Paragraph({ spacing: { after: 200 }, children: [
          new TextRun({ text: "📋 Kết quả cần nộp: ", bold: true, size: 22, color: "15803d" }),
          new TextRun({ text: "3 ảnh screenshot bai3_firewall.png, bai3_services.png, bai3_sysinfo.png", size: 22 })
        ]}),

        new Paragraph({ spacing: { after: 400 }, children: [] }),

        // Lưu ý cuối
        new Paragraph({
          spacing: { before: 400, after: 100 },
          border: { top: { color: "cccccc", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          children: [new TextRun({ text: "⚠️  LƯU Ý KHI NỘP BÀI", bold: true, size: 22, color: "dc2626" })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "• Nén tất cả ảnh và file vào 1 file ZIP duy nhất.", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "• Đặt tên file ZIP theo đúng định dạng: HoTen_BaiThi.zip", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "• Upload file lên hệ thống tại địa chỉ được cung cấp.", size: 22 })]
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: "• Hệ thống chỉ nhận file trước khi hết giờ thi.", size: 22 })]
        }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(__dirname, "exams", "de_thi_thuc_hanh.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Đã tạo đề thi: " + outPath);
}

createExam().catch(console.error);
