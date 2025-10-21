# 🎛️ Admin Panel Functions Reference Card

## Quick Access
- **Open Panel:** Click admin button or press `Ctrl+Shift+A`
- **Login:** Username: `admin6622` | Password: `admin6633`
- **Close Panel:** Click X or click outside panel

---

## 🔐 AUTHENTICATION (2 Functions)

| Function | Location | Action |
|----------|----------|--------|
| **Login** | Login Screen | Enter credentials to access dashboard |
| **Token Verify** | Automatic | Validates session on page load |

---

## 📝 PROVIDER TAB (15 Functions)

### Submissions Management (5)
| Function | Location | Action |
|----------|----------|--------|
| **View Submissions** | Live Submissions | Expand to see all current submissions |
| **Toggle Winner** | Submission Card | Click "Winner" to mark/unmark |
| **Remove Submission** | Submission Card | Click "Remove" to delete |
| **Save Winners** | Winners Banner | Save selected winners to database |
| **Winner Count** | Winners Banner | Shows number of selected winners |

### AI Provider Settings (4)
| Function | Location | Action |
|----------|----------|--------|
| **Select Provider** | AI Provider | Choose Gemini or OpenAI |
| **Gemini API Key** | AI Provider | Enter/update Gemini key |
| **OpenAI API Key** | AI Provider | Enter/update OpenAI key |
| **Key Validation** | API Key Input | Green/red dot shows validity |

### Quick Actions (5)
| Function | Location | Action |
|----------|----------|--------|
| **Set Custom Word** | Actions | Manually set today's word |
| **Auto Daily Cycle** | Actions | Toggle automatic daily generation |
| **Schedule Word** | Actions | Schedule tomorrow's word |
| **Generate New Day** | Actions | Create new word + archive current |
| **Summarize** | Actions | Generate AI summary of submissions |

### Current Word (1)
| Function | Location | Action |
|----------|----------|--------|
| **View AI Meaning** | Current Word | See AI-generated definition |

---

## 🖼️ IMAGE TAB (9 Functions)

### Image Settings (4)
| Function | Location | Action |
|----------|----------|--------|
| **Enable Images** | Image Settings | Toggle image generation on/off |
| **ClipDrop Key** | Image Settings | Enter/update ClipDrop API key |
| **Key Validation** | ClipDrop Input | Shows key validity status |
| **Regenerate Image** | Image Settings | Generate new image for current word |

### Abstract Generator (5)
| Function | Location | Action |
|----------|----------|--------|
| **Generate Abstract** | Abstract Generator | Create dreamlike art from word |
| **View Template** | Abstract Generator | See prompt template |
| **Copy Template** | Template Button | Copy prompt to clipboard |
| **Download Image** | Generated Image | Download PNG file |
| **Clear Image** | Generated Image | Remove image and reset |

---

## 📊 ANALYTICS TAB (10 Functions)

### Stats Cards (4)
| Function | Location | Action |
|----------|----------|--------|
| **Total Words** | Stats Grid | Shows total words generated |
| **Submissions Count** | Stats Grid | Shows current submissions |
| **Archived Count** | Stats Grid | Shows archived words |
| **Total Likes** | Stats Grid | Shows sum of all likes |

### Current Word Stats (3)
| Function | Location | Action |
|----------|----------|--------|
| **Word Display** | Current Word Stats | Shows active word info |
| **Metrics** | Current Word Stats | Definitions, likes, image status |
| **Date Display** | Current Word Stats | Shows word date |

### Leaderboards (2)
| Function | Location | Action |
|----------|----------|--------|
| **Top Definitions** | Top Definitions | Shows top 5 by likes |
| **Recent Archive** | Recent Archive | Shows last 5 archived words |

### Visual Indicators (1)
| Function | Location | Action |
|----------|----------|--------|
| **Medal Rankings** | Top Definitions | Gold/Silver/Bronze for top 3 |

---

## ⚙️ GENERAL UI (8 Functions)

| Function | Location | Action |
|----------|----------|--------|
| **Dark Mode** | Header | Toggle dark/light theme |
| **Tab Navigation** | Tab Bar | Switch between Provider/Image/Analytics |
| **Dropdown Toggle** | Section Headers | Expand/collapse sections |
| **Close Panel** | Header / Backdrop | Close admin panel |
| **Save Config** | Footer | Save all settings |
| **Unsaved Indicator** | Footer | Shows when changes not saved |
| **Error Display** | Top of Content | Shows error messages |
| **Loading States** | Various | Spinners and overlays |

---

## 🔧 BACKEND INTEGRATION (10 Endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/login` | POST | Authenticate admin |
| `/api/admin/verify` | GET | Verify token |
| `/api/current` | GET | Get current word |
| `/api/submissions` | GET | Get all submissions |
| `/api/submissions` | DELETE | Remove submission |
| `/api/winners` | POST | Save winners |
| `/api/schedule` | POST | Schedule word |
| `/api/generate` | POST | Generate new word |
| `/api/generate-abstract-image` | POST | Generate abstract image |
| `/api/archive` | POST | Archive word |

---

## 🎯 KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open admin panel |
| `Esc` | Close panel |
| `Tab` | Navigate between inputs |
| `Enter` | Submit form / Generate |
| `Ctrl+S` | Save configuration |

---

## 📊 FUNCTION SUMMARY

| Category | Count |
|----------|-------|
| **Authentication** | 2 |
| **Provider Tab** | 15 |
| **Image Tab** | 9 |
| **Analytics Tab** | 10 |
| **General UI** | 8 |
| **Backend APIs** | 10 |
| **TOTAL** | **54 Functions** |

---

## 🚨 CRITICAL FUNCTIONS

These functions are essential for daily operations:

1. ✅ **Login** - Access dashboard
2. ✅ **Generate New Day** - Create daily word
3. ✅ **Save Winners** - Archive winning definitions
4. ✅ **Summarize** - Generate AI summaries
5. ✅ **Save Configuration** - Persist settings

---

## 🔥 MOST USED FUNCTIONS

Based on typical admin workflow:

1. **View Submissions** - Check community definitions
2. **Toggle Winner** - Select best definitions
3. **Save Winners** - Archive selections
4. **Generate New Day** - Start new cycle
5. **View Analytics** - Monitor engagement

---

## 💡 PRO TIPS

- **Batch Operations:** Select multiple winners before saving
- **Preview Before Generate:** Check submissions before new day
- **Regular Backups:** Download archive data periodically
- **Monitor Analytics:** Track engagement trends
- **Test API Keys:** Validate keys before saving

---

## 🐛 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Can't login | Check credentials: admin6622/admin6633 |
| API errors | Verify API keys in settings |
| No image | Check ClipDrop key and enable images |
| Slow generation | Check network and API rate limits |
| Lost session | Re-login (token expires in 24h) |

---

## 📞 SUPPORT

- **Documentation:** See `ADMIN_TESTING_GUIDE.md`
- **Test Script:** Run `test-admin-panel.js` in console
- **Bug Reports:** Use template in testing guide

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** ✅ All Functions Operational
