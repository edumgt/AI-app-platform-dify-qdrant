const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "../../.env") });

const bcrypt = require("bcryptjs");
const { query } = require("./pool");

async function upsertUser(email, password, role) {
  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users(email, password_hash, role)
     VALUES ($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role`,
    [email, passwordHash, role]
  );
}

async function upsertApp(slug, title, description, difyAppId) {
  await query(
    `INSERT INTO ai_apps(slug, title, description, dify_app_id, input_schema)
     VALUES ($1,$2,$3,$4,$5::jsonb)
     ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, dify_app_id=EXCLUDED.dify_app_id`,
    [
      slug,
      title,
      description,
      difyAppId || "",
      JSON.stringify({
        fields: [
          { name: "query", label: "질문", type: "text", required: true },
          { name: "resume", label: "이력서(선택)", type: "file", required: false }
        ]
      })
    ]
  );
}

async function main() {
  await upsertUser("admin@example.com", "Admin!234", "admin");
  await upsertUser("user@example.com", "User!2345", "user");

  await upsertApp(
    "resume-analyzer",
    "이력서 분석기",
    "이력서를 업로드하면 문서 내용을 바탕으로 요약/개선 포인트를 제공합니다.",
    ""
  );

  await upsertApp(
    "policy-qa",
    "사내 규정 QA",
    "사내 문서(Qdrant) 기반으로 질문에 답합니다.",
    ""
  );

  console.log("[SEED] done");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
