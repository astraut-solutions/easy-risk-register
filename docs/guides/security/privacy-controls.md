# Privacy Controls (Encryption + Response Planning)

This guide covers Phase 4 features:

- Optional **local encryption** for stored data (passphrase-based)
- **Incident response playbooks** per risk (template-based, editable)
- Playbook inclusion in **PDF exports**

## Local encryption (optional)

Easy Risk Register is client-side only and stores data in your browser. If you enable encryption, the app encrypts the persisted store **at rest** using browser crypto APIs.

### Enable encryption

1. Open **Settings**
2. In **Local encryption (optional)**, choose **Enable**
3. Enter a passphrase and confirm it

Notes:
- You will be asked for your passphrase on page load to unlock your data.
- If you forget the passphrase, there is **no recovery**. You must delete local data on that device.
- Keep backups using CSV/PDF exports if the data matters.

### Unlock encryption (on load)

If encryption is enabled and the app is locked, you will see an **Unlock encrypted data** modal. Enter the passphrase to rehydrate your stored risks.

### Rotate / disable / lock

In Settings:
- **Rotate passphrase** re-encrypts the stored data with a new passphrase.
- **Disable** decrypts and stores the data unencrypted on the device.
- **Lock** removes the key from memory for the current session (you’ll need to unlock again).

### Forgot passphrase

If you can’t unlock, use **Delete data** (wipe) in the unlock screen or Settings. This permanently clears the stored risk register on that device.

## Incident response playbooks (per risk)

Playbooks are editable response checklists you can attach to a risk. They’re designed for quick, practical response planning (for example privacy incidents, ransomware, BEC).

### Add a playbook

1. Create or edit a risk
2. Open **Incident response playbook (optional)**
3. Pick a template and click **Add playbook**
4. Edit steps as needed; mark steps done during an incident

## PDF export integration

- **Risk register PDF** includes playbooks for risks that have them.
- **Privacy incident / checklist PDF** includes the playbook for that specific risk (when present).

