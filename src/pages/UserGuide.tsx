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
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">1. Quy trình làm việc hàng ngày (Chi tiết)</h2>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 1: Chuẩn bị & Kích hoạt (Auto-Trigger)</strong>
                    Mỗi ngày đúng 9:00 sáng, nếu bạn đã cài đặt Task Scheduler với file .bat, Chrome sẽ tự động bật tab làm việc trực tiếp vào Dashboard mà không cần login lại. Hệ thống sẽ xác định bạn đang ở Ngày mấy / Phase mấy để đưa ra target volume (số lượng email gửi) phù hợp.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 2: Nhận Nhiệm vụ & Kịch bản (Today's Script)</strong>
                    Trên Dashboard, bạn sẽ thấy phần <strong>Today's Script</strong> và danh sách <strong>Target Emails</strong>. Hãy quan sát thanh <strong>Progress Bar</strong> mục tiêu gửi email (Target Volume) và thẻ <strong>Weekly Sprint</strong> để biết bạn cần gửi bao nhiêu email hôm nay và trong cả tuần để đạt đủ KPI.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 3: Thực thi Gửi Email (Draft in Gmail)</strong>
                    - Click nút <strong>Copy Emails</strong> để copy toàn bộ địa chỉ nhận.<br/>
                    - Click nút <strong>Draft in Gmail</strong> để mở tự động cửa sổ soạn thảo Gmail (nếu nó không dán nội dung chuẩn, hãy click <strong>Copy Body</strong> và dán vào phần soạn thảo).<br/>
                    - <em>Lưu ý quan trọng:</em> Hãy tùy chỉnh (sửa vài từ ngữ nhỏ) vào nội dung để email trông cá nhân hóa, tránh bị Google quét trùng lặp chữ ký 100%. Sau đó bấm Send.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 4: Phản hồi chéo (Co-worker Interaction)</strong>
                    Khi nhận được email warm-up từ người khác, bạn CẦN làm 3 việc:<br/>
                    1. Trả lời (Reply) email đó.<br/>
                    2. Đánh dấu Quan trọng (Star / Mark Important).<br/>
                    3. Check hòm Spam: Nếu email lọt vào spam, bắt buộc phải report "Not spam" và kéo ra ngoài Inbox. Hành động này là cốt lõi để "làm ấm" uy tín email.
                  </div>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div>
                    <strong className="text-white block">Bước 5: Báo cáo kết quả (Log)</strong>
                    Cuối ngày, quay lại Dashboard, tích đủ các mục trong <strong>Daily Checklist</strong> (Sent, Replied, Marked Important, Spam Checked). Nhập số lượng gửi/nhận thực tế để Admin theo dõi qua tab Team Stats.
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
                <li>Script này dùng để mở <strong>Profile Chrome làm việc</strong> của bạn và tự động truy cập thẳng vào OAC Warm-Up Hub.</li>
                <li>Nó không tự động chạy theo giờ! Bạn cần phải gán nó vào <strong>Windows Task Scheduler</strong> để chọn khung giờ mà bạn muốn nhắc nhở (ví dụ: 9h00 sáng mỗi ngày).</li>
                <li>Vì nó sử dụng trực tiếp Profile Chrome (dữ liệu Cookie có sẵn), bạn sẽ không phải đăng nhập lại.</li>
              </ul>
              <h3 className="text-lg font-medium text-white mt-4 mb-2">Cách cài đặt:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Vào màn hình Dashboard (góc trên cùng bên phải). Điền tên Profile Chrome của bạn (ví dụ: Profile 1) và bấm <strong>Get .bat</strong> để tải file về.</li>
                <li>Mở ứng dụng <strong>Task Scheduler</strong> trên Windows của bạn.</li>
                <li>Tạo một Task mới (Create Basic Task), chọn Trigger là "Daily" (Hằng ngày) và <strong>set khung giờ bạn muốn mở</strong> (ví dụ 9h00).</li>
                <li>Ở phần Action, chọn "Start a program" và trỏ đường dẫn đến file <code>.bat</code> bạn vừa tải về.</li>
                <li>Từ giờ trở đi, cứ đúng giờ đó, Windows sẽ tự động bung file trình duyệt web lên đập vào mắt bạn để bạn không thể quên việc gửi email!</li>
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
                <li>
                  <strong className="text-white">Contact Lists:</strong> Kế bên ô "Emails To Send", Admin có thể dùng Dropdown <em>+ Load from List</em> để nạp nhanh danh sách email từ một tệp chiến dịch định sẵn (VD: Tech Startups) mà không cần copy-paste thủ công.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">2. Cấu hình Hệ thống (Firebase Config)</h2>
              <p className="mb-4">
                Các tính năng <strong>Custom Checklist</strong>, <strong>Phase Target Volumes</strong>, và danh sách <strong>Contact Lists</strong> hiện đang được lưu ở mức độ toàn cầu (Global Config). Để chỉnh sửa, Admin cần truy cập trực tiếp vào cơ sở dữ liệu.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Truy cập vào <strong className="text-white">Firebase Console {'>'} Firestore Database</strong>.</li>
                <li>Mở collection <code>config</code>, chọn document <code>app</code>.</li>
                <li>Tại đây, bạn có thể thêm/xóa các mục tiêu trong mảng <code>checklistItems</code>, điều chỉnh KPI theo giai đoạn trong map <code>phaseTargets</code>, hoặc định nghĩa các danh sách khách hàng cố định trong mảng <code>contactLists</code>. Mọi thay đổi sẽ tự động Sync tới Dashboard của toàn bộ team theo thời gian thực (Real-time).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4 border-b border-boder pb-2">3. Quản lý Ngày Bắt Đầu (Start Date)</h2>
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
                <li>matthew.dau@onearw.com</li>
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
