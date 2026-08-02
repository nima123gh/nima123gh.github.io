/**
 * replies.js
 * Renders a threaded reply list for a single star: top-level replies, each of
 * which can have its own replies, and so on to any depth. This module only
 * builds DOM and reports intent (a new reply was written) via callback —
 * persisting it is main.js/firebase.js's job, same pattern as the rest of the app.
 */

import { formatDate } from './utils.js';

/**
 * @param {HTMLElement} container element to render the thread into
 * @param {object} star the star whose replies (star.replies, if any) should render
 * @param {(parentId: string|null, text: string) => void} onSubmitReply called when the
 *        person submits a reply — parentId is null for a top-level reply, or the id of
 *        the reply being answered.
 */
export function renderReplyThread(container, star, onSubmitReply) {
    container.innerHTML = '';

    const replies = Array.isArray(star.replies) ? star.replies : [];
    const byParent = new Map();
    for (const reply of replies) {
        const key = reply.parentId || null;
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key).push(reply);
    }
    for (const list of byParent.values()) {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    function buildLevel(parentId, depth) {
        const children = byParent.get(parentId) || [];
        if (children.length === 0) return null;
        const wrap = document.createElement('div');
        wrap.className = 'reply-list';
        for (const reply of children) {
            wrap.appendChild(buildReplyItem(reply, depth));
        }
        return wrap;
    }

    function buildReplyItem(reply, depth) {
        const item = document.createElement('div');
        item.className = 'reply-item';
        item.dataset.id = reply.id;

        const bubble = document.createElement('div');
        bubble.className = 'reply-item__bubble';

        const text = document.createElement('p');
        text.className = 'reply-item__text';
        text.textContent = reply.text;

        const meta = document.createElement('div');
        meta.className = 'reply-item__meta';

        const date = document.createElement('span');
        date.className = 'reply-item__date';
        date.textContent = formatDate(reply.createdAt);

        const replyBtn = document.createElement('button');
        replyBtn.type = 'button';
        replyBtn.className = 'reply-item__action';
        replyBtn.textContent = 'پاسخ';

        meta.appendChild(date);
        meta.appendChild(replyBtn);
        bubble.appendChild(text);
        bubble.appendChild(meta);
        item.appendChild(bubble);

        const formSlot = document.createElement('div');
        formSlot.className = 'reply-form-slot';
        item.appendChild(formSlot);

        replyBtn.addEventListener('click', () => {
            const isOpen = formSlot.classList.toggle('reply-form-slot--open');
            formSlot.innerHTML = '';
            if (isOpen) {
                const form = buildInlineForm(reply.id);
                formSlot.appendChild(form);
                const textarea = form.querySelector('textarea');
                requestAnimationFrame(() => textarea && textarea.focus());
            }
        });

        const nested = buildLevel(reply.id, depth + 1);
        if (nested) item.appendChild(nested);

        return item;
    }

    function buildInlineForm(parentId) {
        const form = document.createElement('form');
        form.className = 'reply-form';

        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.maxLength = 400;
        textarea.placeholder = 'ریپلای کن پیشی کوچولوم';
        textarea.required = true;

        const actions = document.createElement('div');
        actions.className = 'reply-form__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn--ghost btn--small';
        cancelBtn.textContent = 'لغو';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn--primary btn--small';
        submitBtn.textContent = 'ارسال';

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);
        form.appendChild(textarea);
        form.appendChild(actions);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const value = textarea.value.trim();
            if (!value) return;
            onSubmitReply(parentId, value);
        });

        cancelBtn.addEventListener('click', () => {
            const slot = form.closest('.reply-form-slot');
            slot.classList.remove('reply-form-slot--open');
            slot.innerHTML = '';
        });

        return form;
    }

    const topLevel = buildLevel(null, 0);
    if (topLevel) {
        container.appendChild(topLevel);
    } else {
        const empty = document.createElement('p');
        empty.className = 'reply-empty';
        empty.textContent = 'هنوز ریپلایی نیست دومبوسی';
        container.appendChild(empty);
    }
}
