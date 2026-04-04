# Book Classifier

A system for organizing books taxonomy data - segments, categories, and materials.

## What it does

This app helps you manage hierarchical taxonomy data. You can create segments, organize them into multi-level categories, and classify each segment with its page number.

Main features:

- Create and edit segments with page numbers
- Build multi-level category hierarchies (up to 6 levels)
- Reorder segments within pages
- Manage materials and export to Excel
- User management with role-based access control
- Switch between dark and light themes

## Roles & Permissions

The system uses a flexible permission system based on specific flags:

- **Admin**: Has full access to all features, including user management and all materials.
- **Category Editor**: Can create and edit the category hierarchy.
- **Material Access**: Users can be restricted to view only specific materials assigned to them.

## Built with

Next.js, MongoDB, Tailwind CSS, and ExcelJS for exports.
