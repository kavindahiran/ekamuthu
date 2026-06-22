"use client";

import { useActionState, useState } from "react";
import { postQuestionAction, replyToQuestionAction, pinQuestionAction } from "@/actions/question.actions";

interface Author {
  id: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

interface Question {
  id: string;
  body: string;
  replyBody?: string | null;
  repliedAt?: Date | string | null;
  isPinned: boolean;
  createdAt: Date | string;
  author: Author;
}

interface Props {
  listingId: string;
  hostId: string;
  questions: Question[];
  /** null = not signed in */
  currentUserId: string | null;
}

function Avatar({ user, size = 8 }: { user: Author; size?: number }) {
  const name = user.displayName ?? user.name;
  const cls = `h-${size} w-${size} rounded-full object-cover flex-shrink-0`;
  if (user.avatarUrl) return <img src={user.avatarUrl} alt={name} className={cls} />;
  return (
    <div className={`${cls} bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-xs`}>
      {name[0]}
    </div>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function QuestionCard({
  q,
  listingId,
  hostId,
  currentUserId,
}: {
  q: Question;
  listingId: string;
  hostId: string;
  currentUserId: string | null;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const isHost = currentUserId === hostId;
  const authorName = q.author.displayName ?? q.author.name;

  return (
    <div className={`rounded-xl border ${q.isPinned ? "border-amber-300 bg-amber-50" : "border-stone-100 bg-white"} p-4 space-y-3`}>
      {q.isPinned && (
        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
          📌 Pinned by host
        </p>
      )}

      {/* Question */}
      <div className="flex gap-3">
        <Avatar user={q.author} size={8} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-stone-900">{authorName}</span>
            {q.author.id === hostId && (
              <span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Host</span>
            )}
            <span className="text-xs text-stone-400">{formatDate(q.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-stone-700 leading-relaxed">{q.body}</p>
        </div>
      </div>

      {/* Host reply */}
      {q.replyBody && (
        <div className="ml-11 pl-4 border-l-2 border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Host replied</p>
          <p className="text-sm text-stone-700 leading-relaxed">{q.replyBody}</p>
        </div>
      )}

      {/* Host actions */}
      {isHost && (
        <div className="ml-11 flex items-center gap-3">
          {!q.replyBody && (
            <button
              type="button"
              onClick={() => setReplyOpen((o) => !o)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium transition cursor-pointer"
            >
              {replyOpen ? "Cancel" : "Reply"}
            </button>
          )}
          <form action={pinQuestionAction}>
            <input type="hidden" name="questionId" value={q.id} />
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="isPinned" value={String(q.isPinned)} />
            <button type="submit" className="text-xs text-stone-400 hover:text-stone-600 transition cursor-pointer">
              {q.isPinned ? "Unpin" : "📌 Pin"}
            </button>
          </form>
        </div>
      )}

      {/* Inline reply form */}
      {isHost && replyOpen && !q.replyBody && (
        <form
          action={async (fd) => {
            await replyToQuestionAction(fd);
            setReplyOpen(false);
          }}
          className="ml-11 space-y-2"
        >
          <input type="hidden" name="questionId" value={q.id} />
          <input type="hidden" name="listingId" value={listingId} />
          <textarea
            name="replyBody"
            rows={2}
            required
            minLength={3}
            maxLength={500}
            placeholder="Write your reply…"
            className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-4 py-1.5 transition cursor-pointer"
          >
            Post reply
          </button>
        </form>
      )}
    </div>
  );
}

export function QuestionBoard({ listingId, hostId, questions, currentUserId }: Props) {
  const [formState, formAction, isPending] = useActionState(postQuestionAction, null);
  const [bodyValue, setBodyValue] = useState("");

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-stone-900">
          Evening Q&amp;A
        </h2>
        <span className="text-sm text-stone-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
      </div>

      <p className="text-sm text-stone-500">
        Ask the host anything about the evening — the menu, parking, dress code, or what to bring.
        All guests can see the answers.
      </p>

      {/* Questions list */}
      {questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-10 text-center">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm text-stone-400">No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              listingId={listingId}
              hostId={hostId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Post a question */}
      {currentUserId ? (
        <form
          action={async (fd) => {
            await formAction(fd);
            setBodyValue("");
          }}
          className="space-y-2"
        >
          <input type="hidden" name="listingId" value={listingId} />
          <textarea
            name="body"
            rows={3}
            required
            minLength={3}
            maxLength={500}
            value={bodyValue}
            onChange={(e) => setBodyValue(e.target.value)}
            placeholder="Ask something about this evening…"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none transition"
          />
          <div className="flex items-center justify-between gap-3">
            {formState?.error && (
              <p className="text-xs text-red-600">{formState.error}</p>
            )}
            <div className="flex-1" />
            <span className="text-xs text-stone-400">{bodyValue.length}/500</span>
            <button
              type="submit"
              disabled={isPending || bodyValue.trim().length < 3}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 transition cursor-pointer"
            >
              {isPending ? "Posting…" : "Ask"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-stone-100 bg-stone-50 px-5 py-4 text-center">
          <p className="text-sm text-stone-500">
            <a href="/signin" className="text-amber-600 font-medium hover:underline">Sign in</a>
            {" "}to ask a question
          </p>
        </div>
      )}
    </section>
  );
}
