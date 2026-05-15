import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Terminal, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function UserGuide() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'member' | 'admin'>(profile?.role === 'admin' ? 'admin' : 'member');

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            OAC Warm-Up Guide
          </h1>
          <p className="text-slate-400 mt-2">Hướng dẫn sử dụng và cài đặt công cụ Warm-Up Email</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('member')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'member'
              ? 'bg-primary text-white shadow-lg shadow-primary/25 glow-blue'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Users className="w-5 h-5" />
          Member Guide
        </button>
        {profile?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 glow-red'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            Admin Guide
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto glass rounded-2xl p-8 prose prose-invert max-w-none">
        {activeTab === 'member' ? (
          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">1. Quy trình làm việc hàng ngày</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 1: Lấy thông tin Script</strong>
                    Vào tab <span className="text-primary">Dashboard</span>, bạn sẽ thấy tiến độ ngày hôm nay. Xem các Script mẫu được Admin soạn sẵn. Bạn có thể sử dụng tính năng <strong>Draft in Gmail</strong> để hệ thống tự mở cửa sổ soạn thảo.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 2: Gửi và Nhận Email</strong>
                    Dùng thông tin từ tab Dashboard (Campaign Emails) để gửi email đến các thành viên trong team. Nội dung nên được tùy biến để tránh bị Google đánh dấu là email spam/máy móc.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 3: Báo cáo kết quả (Log)</strong>
                    Sau khi hoàn thành, nhớ quay lại mục <strong>Log Form</strong> ở cuối trang Dashboard để điền số lượng email đã gửi, số reply nhận được, và đánh dấu nếu có email bị rơi vào Spam. Bạn chỉ có thể log 1 lần mỗi ngày!
                  </div>
                </li>
              </ul>
            </section>

            <section className="bg-slate-800/50 p-6 rounded-xl border border-boder">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                Giải thích về File .bat (Tự động mở Chrome)
              </h2>
              <p className="mb-4">
                Hệ thống có cung cấp một file Script <code>.bat</code> để giúp bạn tự động hóa việc mở trình duyệt Chrome đúng giờ mỗi ngày, nhắc nhở bạn vào làm nhiệm vụ Warm-up mà không sợ quên.
              </p>
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Tính năng này hoạt động thế nào?</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Script này sẽ kết nối với <strong>Windows Task Scheduler</strong> trên máy tính của bạn.</li>
                <li>Đúng thời gian bạn đã cài đặt (ví dụ 9h sáng), hệ thống Windows sẽ tự chạy file <code>.bat</code>.</li>
                <li>File này sử dụng lệnh command line để kích hoạt <strong>Profile Chrome làm việc</strong> của bạn và tự động mở thẳng vào đường link OAC Warm-Up Hub.</li>
                <li>Vì nó sử dụng trực tiếp Profile Chrome (dữ liệu Cookie có sẵn), bạn sẽ không phải đăng nhập lại mỗi lần nó mở lên.</li>
              </ul>
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Cách cài đặt:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Vào màn hình Dashboard, cuộn xuống phần "Auto-Launcher".</li>
                <li>Tải file <code>.bat</code> về máy.</li>
                <li>Click đúp vào file để chạy lần đầu tiên. Nó sẽ tự động đăng ký với Windows Task Scheduler.</li>
              </ol>
            </section>
          </div>
        ) : (
          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">1. Quản lý Script Toàn Team</h2>
              <p className="mb-4">
                Tab <strong>My Scripts</strong> (Script Manager) là nơi bạn tạo và phân phối nội dung email warm-up cho toàn team. Các thay đổi ở đây sẽ cập nhật trực tiếp lên Dashboard của mọi người.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-white">Tính năng AI HTML Import:</strong> Nếu bạn dùng ChatGPT/Claude để gen hàng loạt nội dung, bạn có thể copy mã HTML đó, bấm nút <em>AI HTML Import</em> và dán vào. Hệ thống sẽ tự bóc tách Subject và Body.
                </li>
                <li>
                  <strong className="text-white">Gán người nhận (Campaign Emails):</strong> Khi soạn Script, bạn click vào các "pills" tên thành viên ở trên ô nhập để gán nhanh danh sách người nhận (recipients).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">2. Quản lý Ngày Bắt Đầu (Start Date)</h2>
              <p className="mb-4">
                Chu kỳ 28 ngày của toàn team được đồng bộ qua 1 biến duy nhất là <code>startDate</code>. 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Trong tab Script Manager, góc trên bên phải có nút hình lịch.</li>
                <li>Bạn có thể chọn ngày bắt đầu của chiến dịch Warm-up. </li>
                <li>Ngày hiện tại trên Dashboard của member sẽ được tính tự động: <code>Current Day = (Hôm nay - Start Date) + 1</code>.</li>
              </ul>
            </section>

            <section className="bg-rose-500/10 p-6 rounded-xl border border-rose-500/20">
              <h2 className="text-xl font-semibold text-rose-400 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Quản trị viên (Admin Roles)
              </h2>
              <p className="mb-2">
                Quyền Admin hiện tại đang được cấu hình cố định (hard-code) dựa trên danh sách email trong <strong>Firebase Authentication / Firestore Rules</strong>, bao gồm:
              </p>
              <ul className="list-disc pl-5 text-rose-300">
                <li>oac.vn@onearw.com</li>
                <li>lauren.luu@onearw.com</li>
                <li>ellie.tran@onearw.com</li>
              </ul>
              <p className="mt-4 text-sm italic">
                Lưu ý: Để cấp quyền cho một Admin mới, bạn cần truy cập vào Firebase Console {'>'} Firestore Database {'>'} Collection `users` và sửa field `role` của người đó thành `admin`, hoặc chỉnh sửa trực tiếp trong source code.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
