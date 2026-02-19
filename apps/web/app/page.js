export default function Home() {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h1 className="text-xl font-semibold">플랫폼 개요</h1>
      <p className="mt-2 text-gray-700">
        Dify 워크플로우 실행 엔진 + Qdrant RAG를 기반으로, 회원/결제/앱카탈로그/관리자 기능을 얹는 템플릿입니다.
      </p>
      <div className="mt-4 flex gap-2">
        <a className="rounded-md bg-black px-4 py-2 text-sm text-white" href="/apps">AI 앱 목록</a>
        <a className="rounded-md border px-4 py-2 text-sm" href="/login">로그인</a>
      </div>
    </div>
  );
}
