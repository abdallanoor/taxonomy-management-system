# Taxonomy Management System

A web app for organizing taxonomy data - segments, categories, and materials.

## What it does

This app helps you manage hierarchical taxonomy data. You can create segments, organize them into multi-level categories, and attach materials to each category.

Main features:

- Create and edit segments
- Build category hierarchies with drag-and-drop
- Manage materials and export to Excel
- User management with role-based access control
- Switch between dark and light themes

## Roles & Permissions

The system uses a flexible permission system based on specific flags:

- **Admin**: Has full access to all features, including user management and all materials.
- **Category Editor**: Can create and edit segments and modify the category hierarchy.
- **Material Access**: Users can be restricted to view only specific materials assigned to them.

## Built with

Next.js, MongoDB, Tailwind CSS, and a few other libraries like dnd-kit for drag-and-drop and ExcelJS for exports.
