export const metadata = {
  title: "🥚 Easter Egg - CBH Youth Online",
  robots: { index: false, follow: false },
};

// Điền tên thật vào đây. avatar: để trống ("") sẽ hiện chữ cái đầu của tên.
const FOUNDERS = [
  { name: "Dương Tùng Anh", role: "Sáng lập / CEO", quote: "Động vật ưa sống về đêm.", avatar: "/images/tunganh.png" },
  { name: "Hoàng Phát", role: "Đồng sáng lập / COO", quote: "Innovate or die.", avatar: "/images/hoangphat.jpeg" },
];

const CORE_TEAMS = [
  {
    title: "Đội Truyền Thông",
    gen: "GEN 0",
    lead: { name: "Trưởng ban truyền thông", role: "Trưởng Ban / Truyền Thông", quote: "Sáng tạo là chìa khóa.", avatar: "" },
    members: [
      { name: "Thành viên 1", role: "Thành viên", quote: "Sáng tạo là thông điệp.", avatar: "" },
      { name: "Thành viên 2", role: "Thành viên", quote: "Lan tỏa giá trị.", avatar: "" },
      { name: "Thành viên 3", role: "Truyền thông", quote: "Kết mọi người.", avatar: "" },
      { name: "Thành viên 4", role: "Thành viên", quote: "Truyền cảm hứng.", avatar: "" },
    ],
  },
];

const DEV_TEAMS = [
  {
    title: "Phát Triển",
    lead: { name: "Trưởng ban phát triển", role: "Trưởng Ban (GEN 0)", quote: "Code is life.", avatar: "" },
    members: [{ name: "Thành viên", role: "Thành viên", quote: "Building future.", avatar: "" }],
  },
  {
    title: "Developer",
    lead: { name: "Trưởng ban developer", role: "Trưởng Ban (GEN 0)", quote: "Debug to perfection.", avatar: "" },
    members: [{ name: "Thành viên", role: "Thành viên", quote: "Optimize everything.", avatar: "" }],
  },
  {
    title: "Tester",
    lead: { name: "Trưởng ban kiểm thử", role: "Trưởng Ban (GEN 0)", quote: "Bug-free is the goal.", avatar: "" },
    members: [{ name: "Thành viên", role: "Thành viên", quote: "Test with precision.", avatar: "" }],
  },
];

function Avatar({ name, avatar }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  if (avatar) {
    return <img src={avatar} alt={name} className="egg-avatar egg-avatar-img" />;
  }
  return <div className="egg-avatar egg-avatar-fallback">{initial}</div>;
}

function PersonCard({ person, big }) {
  return (
    <div className={`egg-card ${big ? "egg-card-big" : ""}`}>
      <Avatar name={person.name} avatar={person.avatar} />
      <div className="egg-name">{person.name}</div>
      <div className="egg-role">{person.role}</div>
      {person.quote && <div className="egg-quote">{person.quote}</div>}
    </div>
  );
}

export default function EggPage() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .egg-page {
          min-height: 100vh;
          background: #f3f7f4;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding-bottom: 48px;
          text-align: center;
        }
        .egg-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 20px;
          background: #ffffff;
          border-bottom: 1px solid #e5e9e6;
        }
        .egg-header img { width: 28px; height: 28px; border-radius: 6px; }
        .egg-header span { font-weight: 700; font-size: 15px; color: #1a1a1a; }
        .egg-banner {
          margin: 16px;
          padding: 22px 20px;
          border-radius: 18px;
          background: linear-gradient(135deg, #1f8a4c, #14653a);
          color: #fff;
        }
        .egg-banner h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          line-height: 1.4;
        }
        .egg-section {
          padding: 0 16px;
          margin-top: 28px;
          max-width: 720px;
          margin-left: auto;
          margin-right: auto;
        }
        .egg-section-title {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 800;
          color: #14653a;
          margin-bottom: 14px;
        }
        .egg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          justify-content: center;
        }
        .egg-grid-2 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
        .egg-team-box {
          border: 1px solid #d7e6da;
          border-radius: 16px;
          padding: 14px;
          background: #f8fbf9;
          margin-bottom: 18px;
        }
        .egg-team-header {
          text-align: center;
          font-weight: 800;
          font-size: 15px;
          margin-bottom: 6px;
          color: #1a1a1a;
        }
        .egg-gen-tag {
          display: block;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #b8860b;
          background: #fff3d6;
          border-radius: 20px;
          padding: 2px 10px;
          width: fit-content;
          margin: 0 auto 10px;
        }
        .egg-card {
          background: #fff;
          border: 1px solid #e5e9e6;
          border-radius: 14px;
          padding: 12px 10px;
          text-align: center;
        }
        .egg-card-big { padding: 16px 12px; }
        .egg-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          margin: 0 auto 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .egg-avatar-fallback {
          background: #dff2e6;
          color: #14653a;
          font-weight: 800;
          font-size: 20px;
        }
        .egg-avatar-img { object-fit: cover; }
        .egg-name { font-weight: 700; font-size: 13.5px; color: #1a1a1a; }
        .egg-role { font-size: 11.5px; color: #6b7a70; margin-top: 2px; }
        .egg-quote { font-size: 11px; color: #14653a; font-style: italic; margin-top: 6px; }
        .egg-founders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          justify-content: center;
        }
        .egg-banner { max-width: 720px; margin-left: auto; margin-right: auto; }
        .egg-footer {
          text-align: center;
          margin-top: 40px;
          padding: 0 20px;
          color: #6b7a70;
          font-size: 12.5px;
        }
      `,
        }}
      />
      <div className="egg-page">
        <div className="egg-header">
          <span>🐣 CBH Youth Online — Easter Egg</span>
        </div>

        <div className="egg-banner">
          <h1>XIN CHÀO, ĐỘI NGŨ<br />&apos;SÁNG TẠO ÂM THẦM&apos; 👋</h1>
        </div>

        <div className="egg-section">
          <div className="egg-section-title">✨ Ban sáng lập</div>
          <div className="egg-founders-grid">
            {FOUNDERS.map((p) => (
              <PersonCard key={p.name} person={p} big />
            ))}
          </div>
        </div>

        <div className="egg-section">
          <div className="egg-section-title">🚀 Đội ngũ chính</div>
          {CORE_TEAMS.map((team) => (
            <div className="egg-team-box" key={team.title}>
              <div className="egg-team-header">{team.title}</div>
              <div className="egg-gen-tag">🏅 TRƯỞNG BAN ({team.gen})</div>
              <PersonCard person={team.lead} />
              <div style={{ height: 12 }} />
              <div className="egg-grid">
                {team.members.map((m) => (
                  <PersonCard key={m.name} person={m} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="egg-section">
          <div className="egg-section-title">🚀 Đội phát triển &amp; kiểm thử</div>
          <div className="egg-grid-2" style={{ display: "grid" }}>
            {DEV_TEAMS.map((team) => (
              <div className="egg-team-box" key={team.title}>
                <div className="egg-team-header">{team.title}</div>
                <div className="egg-gen-tag">🏅 TRƯỞNG BAN ({"GEN 0"})</div>
                <PersonCard person={team.lead} />
                <div style={{ height: 12 }} />
                <div className="egg-grid">
                  {team.members.map((m) => (
                    <PersonCard key={m.name} person={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="egg-footer">
          Cảm ơn tất cả các thế hệ đã âm thầm xây dựng CBH Youth Online. 💚
          <br />
          Mãi mãi là học sinh Chuyên Biên Hòa!
        </div>
      </div>
    </>
  );
}
