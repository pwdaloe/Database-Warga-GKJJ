-- PM Agent Email Script
-- Usage: osascript pm_email.applescript "to_recipient" "subject" "body"
-- Project pribadi (Database Warga GKJJ) — recipient dikunci ke daru@sunartha.co.id, tidak ada CC.
-- Argumen "to_recipient" diabaikan; dipertahankan agar signature tetap kompatibel dengan skill lain.

on run argv
    set recipientEmail to "daru@sunartha.co.id"
    set emailSubject to item 2 of argv
    set emailBody to item 3 of argv

    tell application "Mail"
        set newMessage to make new outgoing message with properties {subject:emailSubject, content:emailBody, visible:false}
        tell newMessage
            make new to recipient at end of to recipients with properties {address:recipientEmail}
        end tell
        send newMessage
    end tell

    return "Email terkirim ke " & recipientEmail
end run
