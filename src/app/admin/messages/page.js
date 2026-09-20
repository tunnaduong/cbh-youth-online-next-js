"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Drawer, Empty, Spin, Tabs, Tag, Tooltip, message } from "antd";
import { EyeOutlined, LockOutlined, TeamOutlined, UserOutlined, PaperClipOutlined } from "@ant-design/icons";
import ResourceTable, { fmtDate, fmtNumber, errMsg } from "../_components/ResourceTable";
import {
  adminGetConversations,
  adminGetConversationMessages,
  adminSearchMessages,
  adminGetMessageAccessLogs,
} from "@/app/Api";

const convName = (c) =>
  c?.type === "private" || !c?.name
    ? (c?.participants || []).map((p) => p.username).join(" ↔ ") || `Cuộc trò chuyện #${c?.id}`
    : c.name;

const TypeTag = ({ type }) =>
  type === "private" ? (
    <Tag icon={<UserOutlined />}>Riêng tư</Tag>
  ) : (
    <Tag icon={<TeamOutlined />} color="blue">
      Nhóm
    </Tag>
  );

function MessageBubble({ m, highlight }) {
  const removed = m.deleted_at || m.is_recalled;
  const files = m.file_urls?.length ? m.file_urls : m.file_url ? [m.file_url] : [];
  return (
    <div id={`msg-${m.id}`} className={`flex flex-col gap-1 ${highlight ? "bg-amber-50 -mx-2 px-2 py-1 rounded-lg" : ""}`}>
      <div className="flex items-baseline gap-2 text-xs">
        <span className="font-semibold text-gray-800 dark:text-gray-100">{m.user?.username || m.guest_name || "Khách"}</span>
        <span className="text-gray-400 dark:text-gray-500">{fmtDate(m.created_at)}</span>
        {m.is_edited && <span className="text-gray-400 dark:text-gray-500">· đã sửa</span>}
        {m.is_forwarded && <span className="text-gray-400 dark:text-gray-500">· chuyển tiếp</span>}
        {m.is_recalled && <Tag color="orange" className="!text-[10px] !leading-4">Đã thu hồi</Tag>}
        {m.deleted_at && <Tag color="red" className="!text-[10px] !leading-4">Đã xóa</Tag>}
      </div>
      <div
        className={`self-start max-w-[85%] rounded-2xl rounded-tl-md px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          removed ? "bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-neutral-700" : "bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
        }`}
      >
        {m.type && m.type !== "text" && <Tag className="mb-1">{m.type}</Tag>}
        {m.content}
        {files.map((f) => (
          <a key={f} href={f} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs mt-1">
            <PaperClipOutlined /> {f.split("/").pop()}
          </a>
        ))}
      </div>
    </div>
  );
}

function ConversationViewer({ conversationId, highlightId, onClose }) {
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    setData(null);
    setMessages([]);
    setLoading(true);
    adminGetConversationMessages(conversationId)
      .then((res) => {
        setData(res.data.conversation);
        setMessages(res.data.messages || []);
        setHasMore(res.data.has_more);
        setTimeout(() => {
          const target = highlightId && document.getElementById(`msg-${highlightId}`);
          (target || bottomRef.current)?.scrollIntoView({ block: "center" });
        }, 50);
      })
      .catch((err) => message.error(errMsg(err, "Không thể tải tin nhắn")))
      .finally(() => setLoading(false));
  }, [conversationId, highlightId]);

  const loadOlder = async () => {
    setLoading(true);
    try {
      const res = await adminGetConversationMessages(conversationId, { before_id: messages[0]?.id });
      setMessages((prev) => [...(res.data.messages || []), ...prev]);
      setHasMore(res.data.has_more);
    } catch (err) {
      message.error(errMsg(err, "Không thể tải thêm"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      open={!!conversationId}
      onClose={onClose}
      width={560}
      title={
        data ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{convName(data)}</span>
            <TypeTag type={data.type} />
          </div>
        ) : (
          "Đang tải..."
        )
      }
      styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
    >
      <div className="px-4 py-2 text-xs text-amber-800 bg-amber-50 border-b border-amber-100 dark:text-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 flex items-center gap-1.5">
        <LockOutlined /> Lượt xem này đã được ghi vào nhật ký truy cập.
      </div>
      {data && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-700 text-xs text-gray-500 dark:text-gray-400">
          Thành viên: {(data.participants || []).map((p) => `@${p.username}`).join(", ")}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {hasMore && (
          <div className="text-center">
            <Button size="small" loading={loading} onClick={loadOlder}>
              Tải tin nhắn cũ hơn
            </Button>
          </div>
        )}
        {loading && !messages.length ? (
          <div className="flex justify-center py-16">
            <Spin />
          </div>
        ) : messages.length ? (
          messages.map((m) => <MessageBubble key={m.id} m={m} highlight={m.id === highlightId} />)
        ) : (
          <Empty description="Chưa có tin nhắn" />
        )}
        <div ref={bottomRef} />
      </div>
    </Drawer>
  );
}

export default function AdminMessagesPage() {
  const [viewing, setViewing] = useState(null); // { id, highlightId }
  const open = useCallback((id, highlightId) => setViewing({ id, highlightId }), []);

  const conversationColumns = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Cuộc trò chuyện",
      key: "name",
      render: (_, c) => (
        <div className="max-w-[360px]">
          <div className="font-medium truncate">{convName(c)}</div>
          {c.type !== "private" && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {(c.participants || []).length} thành viên
            </div>
          )}
        </div>
      ),
    },
    { title: "Loại", dataIndex: "type", render: (t) => <TypeTag type={t} /> },
    { title: "Tin nhắn", dataIndex: "messages_count", render: fmtNumber },
    { title: "Hoạt động gần nhất", dataIndex: "messages_max_created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, c) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => open(c.id)}>
          Xem
        </Button>
      ),
    },
  ];

  const searchColumns = [
    {
      title: "Nội dung",
      dataIndex: "content",
      render: (v, m) => (
        <div className="max-w-[420px] whitespace-pre-wrap break-words">
          {v}
          {(m.deleted_at || m.is_recalled) && (
            <Tag color="red" className="ml-1">
              {m.deleted_at ? "Đã xóa" : "Đã thu hồi"}
            </Tag>
          )}
        </div>
      ),
    },
    { title: "Người gửi", key: "user", render: (_, m) => m.user?.username || m.guest_name || "-" },
    {
      title: "Cuộc trò chuyện",
      key: "conv",
      render: (_, m) => (m.conversation?.name ? m.conversation.name : `#${m.conversation_id}`),
    },
    { title: "Thời gian", dataIndex: "created_at", render: fmtDate },
    {
      title: "",
      key: "actions",
      fixed: "right",
      render: (_, m) => (
        <Tooltip title="Mở cuộc trò chuyện tại tin nhắn này">
          <Button size="small" icon={<EyeOutlined />} onClick={() => open(m.conversation_id, m.id)} />
        </Tooltip>
      ),
    },
  ];

  // The search endpoint rejects an empty query; don't hit it until the admin types something.
  const searchFetcher = useCallback(
    (params) =>
      params.search
        ? adminSearchMessages(params)
        : Promise.resolve({ data: { data: [], total: 0, current_page: 1, per_page: params.per_page } }),
    []
  );

  const logColumns = [
    { title: "Thời gian", dataIndex: "created_at", render: fmtDate },
    { title: "Quản trị viên", key: "admin", render: (_, l) => l.admin?.username || `#${l.admin_id}` },
    {
      title: "Hành động",
      key: "action",
      render: (_, l) =>
        l.action === "view_conversation" ? (
          <span>
            Xem cuộc trò chuyện{" "}
            <a onClick={() => open(l.conversation_id)}>#{l.conversation_id}</a>
            {l.conversation?.name ? ` (${l.conversation.name})` : ""}
          </span>
        ) : (
          <span>
            Tìm kiếm: <code>{l.query}</code>
          </span>
        ),
    },
    { title: "IP", dataIndex: "ip" },
  ];

  return (
    <>
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 pt-6">
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message="Tin nhắn riêng tư của người dùng"
          description="Chỉ xem khi cần xử lý báo cáo hoặc vi phạm. Mỗi lần mở cuộc trò chuyện hoặc tìm kiếm đều được ghi lại trong Nhật ký truy cập."
        />
      </div>
      <Tabs
        className="max-w-[1280px] mx-auto w-full [&_.ant-tabs-nav]:px-4 sm:[&_.ant-tabs-nav]:px-6 [&_.ant-tabs-nav]:!mb-0"
        items={[
          {
            key: "conversations",
            label: "Cuộc trò chuyện",
            children: (
              <ResourceTable
                title="Cuộc trò chuyện"
                fetcher={adminGetConversations}
                columns={conversationColumns}
                filters={[
                  { key: "search", type: "search", placeholder: "Username, tên nhóm, ID" },
                  {
                    key: "type",
                    type: "select",
                    placeholder: "Loại",
                    options: [
                      { value: "private", label: "Riêng tư" },
                      { value: "group", label: "Nhóm" },
                    ],
                  },
                ]}
              />
            ),
          },
          {
            key: "search",
            label: "Tìm tin nhắn",
            children: (
              <ResourceTable
                title="Tìm trong nội dung tin nhắn"
                fetcher={searchFetcher}
                columns={searchColumns}
                filters={[{ key: "search", type: "search", placeholder: "Nhập từ khóa (ít nhất 2 ký tự) rồi Enter", width: 360 }]}
              />
            ),
          },
          {
            key: "logs",
            label: "Nhật ký truy cập",
            children: (
              <ResourceTable title="Nhật ký truy cập tin nhắn" fetcher={adminGetMessageAccessLogs} columns={logColumns} />
            ),
          },
        ]}
      />
      <ConversationViewer
        conversationId={viewing?.id}
        highlightId={viewing?.highlightId}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
