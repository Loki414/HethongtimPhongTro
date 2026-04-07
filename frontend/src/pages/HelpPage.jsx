import React from 'react';
import { Link } from 'react-router-dom';

const SAFE_TIPS = [
  {
    title: 'Xác minh thông tin thật',
    body: 'Đối chiếu địa chỉ, giá và hình ảnh với khi xem phòng trực tiếp. Nếu khác biệt lớn, hãy cân nhắc và có thể báo cáo tin qua ứng dụng.',
  },
  {
    title: 'Không chuyển tiền “lạ”',
    body: 'Chỉ thanh toán cọc theo hóa đơn hiển thị trong tài khoản của bạn sau khi đã đặt lịch. Tránh chuyển khoản qua tin nhắn lạ hoặc số tài khoản không khớp thông tin chính thức.',
  },
  {
    title: 'Giữ bằng chứng',
    body: 'Lưu ảnh chụp màn hình hóa đơn cọc, tin nhắn thỏa thuận và biên lai chuyển khoản để tra cứu khi cần.',
  },
  {
    title: 'Đi xem phòng cùng người quen',
    body: 'Đặc biệt lần đầu, nên hẹn ban ngày và có thể rủ thêm người thân hoặc bạn bè đồng hành.',
  },
  {
    title: 'Đọc kỹ điều kiện thuê',
    body: 'Thống nhất rõ tiền cọc, tiền nhà, điện nước, thời hạn và cách hoàn cọc trước khi quyết định.',
  },
  {
    title: 'Dùng kênh báo cáo của hệ thống',
    body: 'Nếu nghi ngờ lừa đảo hoặc nội dung sai lệch, hãy dùng chức năng báo cáo để đội ngũ quản trị xem xét.',
  },
];

const FLOW_STEPS = [
  { step: 1, title: 'Tìm & lọc phòng', text: 'Dùng trang chủ để lọc theo khu vực, giá và tiện ích. Có thể so sánh tối đa 3 phòng cạnh nhau.' },
  { step: 2, title: 'Xem chi tiết & lưu', text: 'Đọc mô tả, xem ảnh, đánh giá. Đăng nhập để lưu phòng yêu thích.' },
  { step: 3, title: 'Đặt lịch thuê', text: 'Chọn ngày bắt đầu và số tháng, gửi yêu cầu đặt phòng. Theo dõi trạng thái trong mục Đặt phòng.' },
  { step: 4, title: 'Thanh toán cọc', text: 'Khi có hóa đơn cọc, kiểm tra số tiền và hướng dẫn. Sau khi chuyển khoản, chờ quản trị xác nhận — bạn sẽ nhận thông báo.' },
  { step: 5, title: 'Liên hệ & ký hợp đồng', text: 'Sau khi cọc được xác nhận, chủ nhà / bên quản lý thường sẽ liên hệ để hoàn tất thủ tục ngoài đời thực.' },
];

const FAQ_ITEMS = [
  {
    q: 'Tôi phải đăng nhập để làm gì?',
    a: 'Đăng nhập để lưu yêu thích, đặt lịch thuê, xem hóa đơn cọc, nhận thông báo và gửi đánh giá hoặc báo cáo.',
  },
  {
    q: 'Cọc được xác nhận như thế nào?',
    a: 'Sau khi bạn chuyển khoản theo hóa đơn, quản trị viên kiểm tra và bấm xác nhận trong hệ thống. Bạn sẽ nhận thông báo trong ứng dụng khi thanh toán được ghi nhận.',
  },
  {
    q: 'Tôi có thể hủy đặt phòng hoặc thay đổi sau khi đặt không?',
    a: 'Tùy chính sách từng tin và thỏa thuận với chủ nhà. Trên hệ thống, hãy xem trạng thái booking và liên hệ qua thông tin được cung cấp hoặc báo cáo nếu có vấn đề.',
  },
  {
    q: 'Làm sao báo cáo tin đăng sai hoặc lừa đảo?',
    a: 'Trên trang chi tiết phòng, dùng mục báo cáo (khi đã đăng nhập) và mô tả rõ lý do. Đội quản trị sẽ xử lý theo quy trình nội bộ.',
  },
  {
    q: '“So sánh phòng” hoạt động ra sao?',
    a: 'Ở trang chủ, tích “Thêm vào so sánh” trên tối đa 3 phòng. Khi chọn đủ 2 phòng, bạn có thể chuyển sang tab So sánh để xem thông tin cạnh nhau và bảng tiện ích.',
  },
  {
    q: 'DACK có thu phí xem tin không?',
    a: 'Xem tin và tìm kiếm là miễn phí. Các khoản tiền hiển thị trên hệ thống (như cọc) là theo từng phòng và hóa đơn cụ thể, không phải phí dịch vụ xem tin.',
  },
];

export default function HelpPage() {
  return (
    <div className="helpPage grid">
      <header className="card helpHero">
        <p className="helpHero__eyebrow">Trợ giúp</p>
        <h1 className="helpHero__title">Thuê phòng an toàn trên DACK</h1>
        <p className="helpHero__lead">
          Hướng dẫn ngắn gọn và câu hỏi thường gặp — giúp bạn tự tin tìm phòng, đặt lịch và thanh toán cọc đúng cách.
        </p>
        <nav className="helpToc" aria-label="Mục lục trang trợ giúp">
          <a className="helpToc__link" href="#safe">
            Thuê an toàn
          </a>
          <a className="helpToc__link" href="#flow">
            Quy trình
          </a>
          <a className="helpToc__link" href="#faq">
            FAQ
          </a>
          <Link className="btn helpToc__cta" to="/">
            Về trang chủ
          </Link>
        </nav>
      </header>

      <section className="card helpSection" id="safe" aria-labelledby="help-safe-heading">
        <h2 className="helpSection__title" id="help-safe-heading">
          Thuê phòng an toàn
        </h2>
        <p className="helpSection__intro">
          Một vài nguyên tắc thực tế trước khi cọc hoặc ký hợp đồng — áp dụng cho mọi kênh tìm phòng, kể cả khi dùng DACK.
        </p>
        <div className="helpTipGrid">
          {SAFE_TIPS.map((tip, i) => (
            <article key={tip.title} className="helpTipCard">
              <span className="helpTipCard__index" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="helpTipCard__title">{tip.title}</h3>
              <p className="helpTipCard__body">{tip.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card helpSection" id="flow" aria-labelledby="help-flow-heading">
        <h2 className="helpSection__title" id="help-flow-heading">
          Quy trình trên DACK
        </h2>
        <p className="helpSection__intro">Từ lúc tìm phòng đến khi cọc được xác nhận — theo đúng các màn hình trong ứng dụng.</p>
        <ol className="helpFlow">
          {FLOW_STEPS.map((item) => (
            <li key={item.step} className="helpFlow__item">
              <span className="helpFlow__badge">{item.step}</span>
              <div>
                <div className="helpFlow__title">{item.title}</div>
                <p className="helpFlow__text">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card helpSection" id="faq" aria-labelledby="help-faq-heading">
        <h2 className="helpSection__title" id="help-faq-heading">
          Câu hỏi thường gặp (FAQ)
        </h2>
        <p className="helpSection__intro">Bấm từng câu hỏi để xem câu trả lời.</p>
        <div className="helpFaq">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="helpFaq__item">
              <summary className="helpFaq__summary">{item.q}</summary>
              <p className="helpFaq__answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="card helpFoot">
        <p className="helpFoot__text">
          Cần hỗ trợ thêm? Hãy đăng nhập và dùng các mục <strong>Đặt phòng</strong>, <strong>Cọc của tôi</strong> hoặc{' '}
          <strong>Báo cáo</strong> tùy tình huống — đó là các kênh trực tiếp gắn với tài khoản của bạn.
        </p>
      </footer>
    </div>
  );
}
