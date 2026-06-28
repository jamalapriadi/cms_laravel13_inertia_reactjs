# Relation Custom Field

The dynamic content builder supports generic relation dropdown fields that load entries of another content type. This enables cross-referencing between content records (e.g. associating a `Location` with a `Province`).

## How to Configure a Relation Field

Follow these steps to link two content types:

1. **Create the Source Content Type**:
   - Go to Content Types page and add a new content type (e.g., `Province`).
   - Create entries for this content type (e.g., "Jawa Barat", "Jawa Tengah", "DKI Jakarta").

2. **Create/Configure the Target Content Type**:
   - Create another content type (e.g., `Location`).

3. **Add a Relation Custom Field**:
   - Go to Custom Fields page and edit the field group for your target content type (e.g., `Location`).
   - Click **Add Field**.
   - Set **Field Type** to **Relation (Dropdown)**.
   - Configure relation settings:
     - **Source Content Type**: Select the content type to fetch entries from (e.g., `Province`).
     - **Label Field (Label dropdown)**: Input the field name to use as the display label (e.g., `title` or another custom field name from the source content type).
     - **Value Field**: Input the field to store (default is `id`).
     - **Allow Multiple Selection**: Check this if you want to support choosing multiple records (renders as scrollable checkboxes).
   - Click **Create Field**.

4. **Add/Edit Entries**:
   - When creating or editing entries for the target content type, the relation dropdown will fetch active options from the source content type automatically.
   - When viewing the entries list, the resolved label/name of the referenced record (e.g. "Jawa Barat") is displayed instead of raw UUID/ID strings.
