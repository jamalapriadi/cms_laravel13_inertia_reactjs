# 🚀 BlockPress CMS (Laravel 13 + Inertia + React)

A modern **Laravel 13 CMS Starter Pack + Block-Based Page Builder System** inspired by WordPress Gutenberg and Webflow.

This project combines a traditional CMS architecture (Posts, Categories, RBAC) with a **modern block-based editor system**, making it suitable for building:

- SaaS CMS platforms
- Ticketing systems
- E-commerce content pages
- Landing page builders
- Wedding invitation websites
- Game top-up platforms
- Custom web applications

---

## 🌐 Overview

BlockPress is designed as a **headless-ready, extensible CMS** where content is no longer stored as HTML, but as structured **block trees**.

Instead of editing rich text, everything is built using reusable blocks.

---

## ✨ Key Features

### 🧱 Block-Based Page Builder

- Drag & drop editor (powered by `dnd-kit`)
- Nested block structure (tree system)
- Real-time editing canvas
- Sidebar block library
- Block inspector (property editor)

Supported blocks:

- Text
- Paragraph
- Heading
- Image
- Button
- List
- Quote
- Code

Fully extensible → custom block types can be added easily.

---

### 🧠 Modern Content Architecture

- Posts separated from Blocks (normalized relational design)
- Recursive parent-child block structure
- JSON-based props & styles per block
- Translation-ready (`block_translations`)
- Order-based drag & drop system

---

### 🗂️ CMS Features (Like WordPress)

- Post Management (Create / Edit / Delete)
- Draft / Publish / Trash system
- Soft delete (recycle bin support)
- Slug auto-generation
- Featured image (meta system)
- Category & Tag system (Taxonomy-based)

---

### 🔐 RBAC (Role-Based Access Control)

- Admin / Editor / Author roles
- Permission-based access system
- Secure dashboard control

---

### ⚡ Backend (Laravel 13)

- Clean Service Layer Architecture (`PostService`)
- Transaction-safe operations
- Recursive block storage engine
- Taxonomy relationship system
- Meta system for flexible content extension

---

### 🎨 Frontend (React + Inertia.js)

- Inertia.js SPA-like experience
- React-based block editor
- TailwindCSS UI system
- Live preview editing
- Sidebar + Canvas + Inspector layout
- Dynamic block rendering system

---

## 🧩 Architecture Overview
