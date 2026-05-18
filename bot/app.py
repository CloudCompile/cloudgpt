import discord
from discord import app_commands
from discord.ext import commands, tasks
import os, asyncio, random, datetime, sqlite3, re, aiohttp, json
try:
    import redis
except ImportError:
    redis = None
from image_cards import make_welcome_card, make_rules_banner, make_roles_banner

# ══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ══════════════════════════════════════════════════════════════════════════════
DB_PATH = "new_beginnings.db"

def db_connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def db_init():
    conn = db_connect(); c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        guild_id INTEGER, user_id INTEGER, xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1, coins INTEGER DEFAULT 0, last_daily TEXT DEFAULT NULL,
        PRIMARY KEY (guild_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS profiles (
        guild_id INTEGER, user_id INTEGER, bio TEXT DEFAULT '', pronouns TEXT DEFAULT '',
        age TEXT DEFAULT '', color TEXT DEFAULT '#7c3aed',
        PRIMARY KEY (guild_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER, user_id INTEGER,
        reason TEXT, mod TEXT, timestamp TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS guild_config (
        guild_id INTEGER PRIMARY KEY, xp_enabled INTEGER DEFAULT 1,
        automod_enabled INTEGER DEFAULT 0, audit_channel_id INTEGER DEFAULT NULL,
        confess_channel_id INTEGER DEFAULT NULL, starboard_channel_id INTEGER DEFAULT NULL,
        starboard_threshold INTEGER DEFAULT 3, role_message_id INTEGER DEFAULT NULL,
        birthday_channel_id INTEGER DEFAULT NULL, ping_message_id INTEGER DEFAULT NULL,
        stats_category_id INTEGER DEFAULT NULL, ticket_category_id INTEGER DEFAULT NULL)""")
    for col in ["ping_message_id","stats_category_id","ticket_category_id"]:
        try: c.execute(f"ALTER TABLE guild_config ADD COLUMN {col} INTEGER DEFAULT NULL")
        except: pass
    c.execute("""CREATE TABLE IF NOT EXISTS automod_words (
        guild_id INTEGER, word TEXT, PRIMARY KEY (guild_id, word))""")
    c.execute("""CREATE TABLE IF NOT EXISTS setup_channels (
        guild_id INTEGER, channel_name TEXT, channel_id INTEGER,
        PRIMARY KEY (guild_id, channel_name))""")
    c.execute("""CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, channel_id INTEGER,
        guild_id INTEGER, message TEXT, due TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS afk (
        guild_id INTEGER, user_id INTEGER, reason TEXT DEFAULT 'AFK', set_at TEXT,
        PRIMARY KEY (guild_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS birthdays (
        guild_id INTEGER, user_id INTEGER, month INTEGER, day INTEGER,
        PRIMARY KEY (guild_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS starboard_posted (
        guild_id INTEGER, message_id INTEGER, sb_message_id INTEGER,
        PRIMARY KEY (guild_id, message_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS giveaways (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER, channel_id INTEGER,
        message_id INTEGER, host_id INTEGER, prize TEXT, winners INTEGER DEFAULT 1,
        ends_at TEXT, ended INTEGER DEFAULT 0)""")
    c.execute("""CREATE TABLE IF NOT EXISTS giveaway_entries (
        giveaway_id INTEGER, user_id INTEGER, PRIMARY KEY (giveaway_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER, user_id INTEGER,
        thread_id INTEGER, open INTEGER DEFAULT 1, created_at TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS server_pet (
        guild_id INTEGER PRIMARY KEY, name TEXT DEFAULT 'Sprout',
        hunger INTEGER DEFAULT 80, happiness INTEGER DEFAULT 80,
        health INTEGER DEFAULT 80, last_fed TEXT DEFAULT NULL,
        last_played TEXT DEFAULT NULL, alive INTEGER DEFAULT 1,
        death_at TEXT DEFAULT NULL)""")
    c.execute("""CREATE TABLE IF NOT EXISTS shop_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER, user_id INTEGER,
        item TEXT, data TEXT, expires_at TEXT DEFAULT NULL, created_at TEXT)""")
    c.execute("""CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id INTEGER, host_id INTEGER,
        title TEXT, description TEXT, location TEXT, event_time TEXT,
        channel_id INTEGER, message_id INTEGER, ended INTEGER DEFAULT 0)""")
    c.execute("""CREATE TABLE IF NOT EXISTS event_signups (
        event_id INTEGER, user_id INTEGER, PRIMARY KEY (event_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS confession_votes (
        message_id INTEGER, user_id INTEGER, vote INTEGER,
        PRIMARY KEY (message_id, user_id))""")
    c.execute("""CREATE TABLE IF NOT EXISTS word_of_day (
        guild_id INTEGER PRIMARY KEY, word TEXT, definition TEXT, posted_date TEXT)""")
    conn.commit(); conn.close()

def get_user(guild_id, user_id):
    conn = db_connect(); c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (guild_id, user_id) VALUES (?,?)", (guild_id, user_id))
    conn.commit()
    row = c.execute("SELECT * FROM users WHERE guild_id=? AND user_id=?", (guild_id, user_id)).fetchone()
    conn.close(); return dict(row)

def update_user(guild_id, user_id, **kwargs):
    conn = db_connect()
    sets = ", ".join(f"{k}=?" for k in kwargs)
    vals = list(kwargs.values()) + [guild_id, user_id]
    conn.execute(f"UPDATE users SET {sets} WHERE guild_id=? AND user_id=?", vals)
    conn.commit(); conn.close()

def get_config(guild_id):
    conn = db_connect(); c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)", (guild_id,))
    conn.commit()
    row = c.execute("SELECT * FROM guild_config WHERE guild_id=?", (guild_id,)).fetchone()
    conn.close(); return dict(row)

def set_config(guild_id, **kwargs):
    conn = db_connect()
    sets = ", ".join(f"{k}=?" for k in kwargs)
    vals = list(kwargs.values()) + [guild_id]
    conn.execute(f"UPDATE guild_config SET {sets} WHERE guild_id=?", vals)
    conn.commit(); conn.close()

def get_channel_id(guild_id, name):
    conn = db_connect()
    row = conn.execute("SELECT channel_id FROM setup_channels WHERE guild_id=? AND channel_name=?", (guild_id, name)).fetchone()
    conn.close(); return row["channel_id"] if row else None

def save_channel(guild_id, name, channel_id):
    conn = db_connect()
    conn.execute("INSERT OR REPLACE INTO setup_channels (guild_id, channel_name, channel_id) VALUES (?,?,?)", (guild_id, name, channel_id))
    conn.commit(); conn.close()

def xp_for_level(level): return 100 * (level ** 2)

# ══════════════════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════════════════
XP_PER_MESSAGE = 10
XP_COOLDOWN    = 60
xp_cooldowns   = {}

LEVEL_ROLES = {5: "🌿 Regular", 10: "🌸 Familiar", 20: "⭐ Veteran", 50: "💎 Legend"}

CHANNELS = [
    ("📌 start here", [
        ("rules",         "Server rules",                           True),
        ("announcements", "Staff announcements",                    True),
        ("get-roles",     "React to assign yourself roles",         True),
    ]),
    ("☀️ general", [
        ("general",       "Main chat",                              False),
        ("introductions", "Say hi when you join!",                  False),
        ("media-dump",    "Images, clips, links",                   False),
        ("memes",         "Memes only",                             False),
    ]),
    ("💬 hangout", [
        ("vent-lounge",        "Safe space",                        False),
        ("advice",             "Ask for or give advice",            False),
        ("confessions",        "Anonymous confessions via /confess",False),
        ("crushes-n-flirting", "Rizz or miss 💘",                   False),
    ]),
    ("🎮 interests", [
        ("gaming",        "Games talk",                             False),
        ("music",         "Share what you're listening to",         False),
        ("art-n-creative","Show your creations",                    False),
        ("anime-n-manga", "Weebs welcome",                          False),
    ]),
    ("🏆 levels", [
        ("level-ups",   "Level-up announcements",                   True),
        ("leaderboard", "Use /leaderboard",                         True),
    ]),
    ("🎉 events", [
        ("giveaways", "Giveaways happen here",                      False),
        ("polls",     "Polls and votes",                            False),
        ("birthdays", "Birthday announcements",                     True),
        ("starboard", "⭐ Best messages",                            True),
    ]),
]

STAFF_CHANNELS = [
    ("🔒 staff", [
        ("mod-chat",  "Staff discussion", False),
        ("mod-log",   "Moderation log",   False),
        ("audit-log", "Auto audit log",   False),
    ]),
]

READ_ONLY_CHANNELS = {
    "rules", "announcements", "get-roles",
    "level-ups", "leaderboard", "birthdays", "starboard"
}

SELF_ROLES = [
    ("🎮", "Gamer",       "Gaming pings"),
    ("🎵", "Music Lover", "Music pings"),
    ("🎨", "Artist",      "Art pings"),
    ("🌸", "Anime Fan",   "Anime pings"),
    ("👀", "Lurker",      "No pings please"),
]

PING_ROLES = [
    ("🔔", "CJ's Life",          "Personal updates, vlogs & life stuff"),
    ("🎊", "Giveaway Pings",     "Get pinged for every giveaway"),
    ("💌", "Referral Pings",     "Codes, referrals & exclusive deals"),
    ("📣", "Announcement Pings", "Major news & big announcements"),
    ("🗳️", "Poll Pings",         "Get pinged when a poll drops"),
    ("⚡",  "Event Pings",        "Events, collabs & special sessions"),
]

STAFF_ROLES = [
    ("Admin",     discord.Color.from_str("#c62828")),
    ("Moderator", discord.Color.from_str("#1565c0")),
    ("Helper",    discord.Color.from_str("#2e7d32")),
]

EMOJI_TO_ROLE = {
    "🎮": "Gamer", "🎵": "Music Lover", "🎨": "Artist",
    "🌸": "Anime Fan", "👀": "Lurker",
    "🔔": "CJ's Life", "🎊": "Giveaway Pings", "💌": "Referral Pings",
    "📣": "Announcement Pings", "🗳️": "Poll Pings", "⚡": "Event Pings",
    "🔞": "18+",
}

ROLE_HIERARCHY_ORDER = [
    "Admin", "Moderator", "Helper",
    "💎 Legend", "⭐ Veteran", "🌸 Familiar", "🌿 Regular",
    "Gamer", "Music Lover", "Artist", "Anime Fan", "Lurker",
    "CJ's Life", "Giveaway Pings", "Referral Pings",
    "Announcement Pings", "Poll Pings", "Event Pings",
    "18+",
]

BOT_STATUSES = [
    ("New Beginnings 🌱", discord.ActivityType.watching),
    ("your messages 👀",  discord.ActivityType.watching),
    ("/help for commands", discord.ActivityType.playing),
    ("the vibes 🎵",      discord.ActivityType.listening),
    ("y'all clown around 🤡", discord.ActivityType.watching),
]

async def ping_roles_embed() -> discord.Embed:
    embed = discord.Embed(
        title="🔔 notification roles",
        description="react to get pinged for what you actually care about.\n\u200b",
        color=discord.Color.from_str("#4f46e5")
    )
    for emoji, name, desc in PING_ROLES:
        embed.add_field(name=f"{emoji} {name}", value=desc, inline=True)
    return embed

# ══════════════════════════════════════════════════════════════════════════════
# BOT SETUP
# ══════════════════════════════════════════════════════════════════════════════
db_init()
intents = discord.Intents.default()
intents.members         = True
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

# ══════════════════════════════════════════════════════════════════════════════
# PERM ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════════════
async def enforce_channel_perms(guild: discord.Guild):
    everyone   = guild.default_role
    staff_roles = [discord.utils.get(guild.roles, name=n) for n, _ in STAFF_ROLES]
    staff_roles = [r for r in staff_roles if r]

    for channel in guild.text_channels:
        name = channel.name.lstrip("🔒 ").strip()

        if name in READ_ONLY_CHANNELS:
            ow = channel.overwrites_for(everyone)
            if ow.send_messages is not False:
                ow.send_messages = False
                ow.add_reactions  = True
                await channel.set_permissions(everyone, overwrite=ow,
                    reason="Auto-enforced: read-only channel")

        if channel.category and "staff" in (channel.category.name or "").lower():
            if channel.overwrites_for(everyone).read_messages is not False:
                deny_ow = discord.PermissionOverwrite(read_messages=False)
                await channel.set_permissions(everyone, overwrite=deny_ow,
                    reason="Auto-enforced: staff channel")
                for r in staff_roles:
                    await channel.set_permissions(r,
                        overwrite=discord.PermissionOverwrite(read_messages=True, send_messages=True),
                        reason="Auto-enforced: staff access")

async def enforce_role_hierarchy(guild: discord.Guild):
    bot_member  = guild.get_member(bot.user.id)
    if not bot_member:
        return
    bot_top_pos = bot_member.top_role.position

    named = {r.name: r for r in guild.roles}
    moveable = [
        named[name] for name in ROLE_HIERARCHY_ORDER
        if name in named and named[name].position < bot_top_pos
    ]

    if not moveable:
        return

    positions = {}
    slot = bot_top_pos - 1
    for role in moveable:
        if slot < 1:
            break
        positions[role] = slot
        slot -= 1

    try:
        await guild.edit_role_positions(positions=positions, reason="Auto-hierarchy sort")
    except (discord.Forbidden, discord.HTTPException):
        pass

# ══════════════════════════════════════════════════════════════════════════════
# BACKGROUND TASKS
# ══════════════════════════════════════════════════════════════════════════════
@tasks.loop(minutes=10)
async def update_stats_channels():
    for guild in bot.guilds:
        cfg = get_config(guild.id)
        cat_id = cfg.get("stats_category_id")
        if not cat_id:
            continue
        cat = guild.get_channel(cat_id)
        if not cat:
            continue
        online = sum(1 for m in guild.members if m.status != discord.Status.offline)
        for ch in cat.channels:
            if "members" in ch.name:
                try: await ch.edit(name=f"👥 Members: {guild.member_count}")
                except: pass
            elif "online" in ch.name:
                try: await ch.edit(name=f"🟢 Online: {online}")
                except: pass

@tasks.loop(minutes=5)
async def rotate_status():
    name, atype = random.choice(BOT_STATUSES)
    await bot.change_presence(activity=discord.Activity(type=atype, name=name))

@tasks.loop(minutes=1)
async def check_reminders():
    now  = datetime.datetime.utcnow().isoformat()
    conn = db_connect()
    due  = conn.execute("SELECT * FROM reminders WHERE due <= ?", (now,)).fetchall()
    for row in due:
        ch = bot.get_channel(row["channel_id"])
        if ch:
            user    = bot.get_user(row["user_id"])
            mention = user.mention if user else f"<@{row['user_id']}>"
            await ch.send(f"⏰ {mention} Reminder: **{row['message']}**")
        conn.execute("DELETE FROM reminders WHERE id=?", (row["id"],))
    conn.commit(); conn.close()

@tasks.loop(hours=1)
async def check_birthdays():
    now = datetime.datetime.utcnow()
    if now.hour != 9:
        return
    conn = db_connect()
    rows = conn.execute("SELECT * FROM birthdays WHERE month=? AND day=?", (now.month, now.day)).fetchall()
    conn.close()
    for row in rows:
        guild  = bot.get_guild(row["guild_id"])
        if not guild: continue
        cfg    = get_config(row["guild_id"])
        ch_id  = cfg.get("birthday_channel_id")
        ch     = guild.get_channel(ch_id) if ch_id else discord.utils.get(guild.text_channels, name="birthdays")
        member = guild.get_member(row["user_id"])
        if ch and member:
            embed = discord.Embed(
                title="🎂 Happy Birthday!",
                description=f"everyone wish {member.mention} a happy birthday! 🎉",
                color=discord.Color.from_str("#f59e0b")
            )
            embed.set_thumbnail(url=member.display_avatar.url)
            await ch.send(embed=embed)

@tasks.loop(minutes=1)
async def check_giveaways():
    now  = datetime.datetime.utcnow().isoformat()
    conn = db_connect()
    rows = conn.execute("SELECT * FROM giveaways WHERE ended=0 AND ends_at <= ?", (now,)).fetchall()
    for row in rows:
        conn.execute("UPDATE giveaways SET ended=1 WHERE id=?", (row["id"],))
        conn.commit()
        entries = conn.execute("SELECT user_id FROM giveaway_entries WHERE giveaway_id=?", (row["id"],)).fetchall()
        guild   = bot.get_guild(row["guild_id"])
        ch      = bot.get_channel(row["channel_id"]) if guild else None
        if not ch: continue
        if not entries:
            await ch.send(f"🎉 Giveaway for **{row['prize']}** ended with no participants.")
        else:
            pool    = [e["user_id"] for e in entries]
            count   = min(row["winners"], len(pool))
            winners = random.sample(pool, count)
            mentions = " ".join(f"<@{w}>" for w in winners)
            await ch.send(f"🎉 Giveaway ended! **{row['prize']}**\n{'Winner' if count==1 else 'Winners'}: {mentions}")
        try:
            msg = await ch.fetch_message(row["message_id"])
            if msg.embeds:
                e = msg.embeds[0]; e.title = f"[ENDED] {row['prize']}"; e.color = discord.Color.red()
                await msg.edit(embed=e)
        except: pass
    conn.close()

# ══════════════════════════════════════════════════════════════════════════════
# ON READY
# ══════════════════════════════════════════════════════════════════════════════
@bot.event
async def on_ready():
    if not hasattr(bot, "_ready_done"):
        bot._ready_done = True
        await bot.tree.sync()
        for guild in bot.guilds:
            await enforce_channel_perms(guild)
            await enforce_role_hierarchy(guild)
        for task in (check_reminders, check_birthdays, check_giveaways,
                     update_stats_channels, rotate_status,
                     pet_decay, post_word_of_day, check_shop_expirations):
            if not task.is_running():
                task.start()
        print(f"✅ {bot.user} ready — perms enforced on {len(bot.guilds)} guild(s)")
    else:
        print(f"🔄 Reconnected as {bot.user}")

async def _log(guild: discord.Guild, embed: discord.Embed):
    cfg   = get_config(guild.id)
    ch_id = cfg.get("audit_channel_id")
    if ch_id:
        ch = guild.get_channel(ch_id)
        if ch:
            try: await ch.send(embed=embed)
            except: pass

# ══════════════════════════════════════════════════════════════════════════════
# EVENTS
# ══════════════════════════════════════════════════════════════════════════════
@bot.event
async def on_member_join(member: discord.Member):
    ch = discord.utils.get(member.guild.text_channels, name="general")
    if ch:
        file, embed = await make_welcome_card(member)
        await ch.send(file=file, embed=embed)

    try:
        rules_id = get_channel_id(member.guild.id, "rules")
        roles_id = get_channel_id(member.guild.id, "get-roles")
        intro_id = get_channel_id(member.guild.id, "introductions")
        dm_embed = discord.Embed(
            title=f"👋 welcome to {member.guild.name}!",
            description=(
                "hey, glad you found us 🌱\n\n"
                "here's a quick start:\n"
                f"• read the rules → <#{rules_id}>\n"
                f"• grab some roles → <#{roles_id}>\n"
                f"• say hello → <#{intro_id}>\n\n"
                "if you need anything, open a ticket in the server. see you in there! 💜"
            ),
            color=discord.Color.from_str("#7c3aed")
        )
        dm_embed.set_thumbnail(url=member.guild.icon.url if member.guild.icon else None)
        await member.send(embed=dm_embed)
    except discord.Forbidden:
        pass

    embed = discord.Embed(title="➕ Member joined", description=str(member), color=discord.Color.green(), timestamp=discord.utils.utcnow())
    embed.set_thumbnail(url=member.display_avatar.url)
    await _log(member.guild, embed)

@bot.event
async def on_member_remove(member: discord.Member):
    embed = discord.Embed(title="➖ Member left", description=str(member), color=discord.Color.red(), timestamp=discord.utils.utcnow())
    await _log(member.guild, embed)

@bot.event
async def on_message(message: discord.Message):
    if message.author.bot or not message.guild:
        return
    guild_id = message.guild.id; user_id = message.author.id

    # AFK clear
    conn = db_connect()
    afk_row = conn.execute("SELECT * FROM afk WHERE guild_id=? AND user_id=?", (guild_id, user_id)).fetchone()
    if afk_row:
        conn.execute("DELETE FROM afk WHERE guild_id=? AND user_id=?", (guild_id, user_id))
        conn.commit()
        await message.channel.send(f"👋 welcome back {message.author.mention}! removed your AFK.", delete_after=5)

    for mentioned in message.mentions:
        if mentioned.bot: continue
        afk_m = conn.execute("SELECT * FROM afk WHERE guild_id=? AND user_id=?", (guild_id, mentioned.id)).fetchone()
        if afk_m:
            await message.channel.send(f"💤 **{mentioned.display_name}** is AFK: {afk_m['reason']}", delete_after=10)
    conn.close()

    # Automod
    cfg = get_config(guild_id)
    if cfg["automod_enabled"]:
        conn  = db_connect()
        words = [r["word"] for r in conn.execute("SELECT word FROM automod_words WHERE guild_id=?", (guild_id,)).fetchall()]
        conn.close()
        for word in words:
            if word in message.content.lower():
                try:
                    await message.delete()
                    await message.channel.send(f"⚠️ {message.author.mention} message removed by automod.", delete_after=5)
                    e = discord.Embed(title="🤖 Automod", color=discord.Color.orange(), timestamp=discord.utils.utcnow())
                    e.add_field(name="User", value=str(message.author))
                    e.add_field(name="Channel", value=message.channel.mention)
                    e.add_field(name="Content", value=message.content[:500], inline=False)
                    await _log(message.guild, e)
                except: pass
                return

    # XP
    if cfg["xp_enabled"]:
        now  = datetime.datetime.utcnow().timestamp()
        key  = (guild_id, user_id)
        last = xp_cooldowns.get(key, 0)
        if now - last >= XP_COOLDOWN:
            xp_cooldowns[key] = now
            ud     = get_user(guild_id, user_id)
            new_xp = ud["xp"] + XP_PER_MESSAGE
            coins  = ud["coins"] + random.randint(1, 3)
            level  = ud["level"]
            needed = xp_for_level(level)
            if new_xp >= needed:
                level += 1; new_xp -= needed
                update_user(guild_id, user_id, xp=new_xp, level=level, coins=coins)
                lvl_ch = discord.utils.get(message.guild.text_channels, name="level-ups") or message.channel
                embed  = await levelup_embed(message.author, level)
                await lvl_ch.send(embed=embed)
                role_name = LEVEL_ROLES.get(level)
                if role_name:
                    role = discord.utils.get(message.guild.roles, name=role_name) or await message.guild.create_role(name=role_name)
                    await message.author.add_roles(role)
            else:
                update_user(guild_id, user_id, xp=new_xp, coins=coins)

    await bot.process_commands(message)
    await on_message_pin_check(message)

@bot.event
async def on_raw_reaction_add(payload):
    guild = bot.get_guild(payload.guild_id)
    if not guild or payload.user_id == bot.user.id: return

    if str(payload.emoji) in EMOJI_TO_ROLE:
        conn    = db_connect()
        cfg_row = conn.execute("SELECT role_message_id, ping_message_id FROM guild_config WHERE guild_id=?", (payload.guild_id,)).fetchone()
        conn.close()
        valid_msgs = set()
        if cfg_row:
            if cfg_row["role_message_id"]: valid_msgs.add(cfg_row["role_message_id"])
            if cfg_row["ping_message_id"]: valid_msgs.add(cfg_row["ping_message_id"])
        if payload.message_id in valid_msgs:
            role = discord.utils.get(guild.roles, name=EMOJI_TO_ROLE[str(payload.emoji)])
            member = guild.get_member(payload.user_id)
            if role and member: await member.add_roles(role)

    if str(payload.emoji) == "🎉":
        conn = db_connect()
        gaw  = conn.execute("SELECT * FROM giveaways WHERE guild_id=? AND message_id=? AND ended=0", (payload.guild_id, payload.message_id)).fetchone()
        if gaw:
            conn.execute("INSERT OR IGNORE INTO giveaway_entries (giveaway_id, user_id) VALUES (?,?)", (gaw["id"], payload.user_id))
            conn.commit()
        conn.close()

    if str(payload.emoji) == "⭐":
        cfg   = get_config(payload.guild_id)
        sb_id = cfg.get("starboard_channel_id")
        if not sb_id: return
        sb_ch = guild.get_channel(sb_id)
        if not sb_ch: return
        try:
            ch  = guild.get_channel(payload.channel_id)
            msg = await ch.fetch_message(payload.message_id)
        except: return
        star_r = discord.utils.get(msg.reactions, emoji="⭐")
        count  = star_r.count if star_r else 0
        if count < cfg.get("starboard_threshold", 3): return
        conn   = db_connect()
        exists = conn.execute("SELECT * FROM starboard_posted WHERE guild_id=? AND message_id=?", (payload.guild_id, payload.message_id)).fetchone()
        if exists:
            try:
                sb_msg = await sb_ch.fetch_message(exists["sb_message_id"])
                await sb_msg.edit(content=f"⭐ **{count}** | {msg.channel.mention}")
            except: pass
            conn.close(); return
        embed = discord.Embed(description=msg.content or "", color=discord.Color.gold(), timestamp=msg.created_at)
        embed.set_author(name=msg.author.display_name, icon_url=msg.author.display_avatar.url)
        embed.add_field(name="Jump", value=f"[Go to message]({msg.jump_url})")
        if msg.attachments: embed.set_image(url=msg.attachments[0].url)
        sb_msg = await sb_ch.send(content=f"⭐ **{count}** | {msg.channel.mention}", embed=embed)
        conn.execute("INSERT INTO starboard_posted (guild_id, message_id, sb_message_id) VALUES (?,?,?)", (payload.guild_id, payload.message_id, sb_msg.id))
        conn.commit(); conn.close()

@bot.event
async def on_raw_reaction_remove(payload):
    if str(payload.emoji) not in EMOJI_TO_ROLE: return
    guild = bot.get_guild(payload.guild_id)
    if not guild: return
    conn    = db_connect()
    cfg_row = conn.execute("SELECT role_message_id, ping_message_id FROM guild_config WHERE guild_id=?", (payload.guild_id,)).fetchone()
    conn.close()
    valid_msgs = set()
    if cfg_row:
        if cfg_row["role_message_id"]: valid_msgs.add(cfg_row["role_message_id"])
        if cfg_row["ping_message_id"]: valid_msgs.add(cfg_row["ping_message_id"])
    if payload.message_id in valid_msgs and payload.user_id != bot.user.id:
        role   = discord.utils.get(guild.roles, name=EMOJI_TO_ROLE.get(str(payload.emoji)))
        member = guild.get_member(payload.user_id)
        if role and member: await member.remove_roles(role)

# ══════════════════════════════════════════════════════════════════════════════
# /setup
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="setup", description="🌱 Setup New Beginnings — skips anything that already exists (owner only)")
async def setup(interaction: discord.Interaction):
    if interaction.user.id != interaction.guild.owner_id:
        await interaction.response.send_message("❌ Owner only.", ephemeral=True); return
    await interaction.response.send_message("🌱 Setting up… this might take a moment!", ephemeral=True)
    guild = interaction.guild

    existing_names = {r.name for r in guild.roles}

    staff_objs = {}
    for name, color in STAFF_ROLES:
        r = discord.utils.get(guild.roles, name=name)
        if not r: r = await guild.create_role(name=name, color=color, mentionable=True)
        staff_objs[name] = r

    for _, rname, __ in SELF_ROLES:
        if rname not in existing_names: await guild.create_role(name=rname, mentionable=False)
    for _, rname, __ in PING_ROLES:
        if rname not in existing_names: await guild.create_role(name=rname, mentionable=True)
    for lvl_role in LEVEL_ROLES.values():
        if lvl_role not in existing_names: await guild.create_role(name=lvl_role)
    if "18+" not in existing_names:
        await guild.create_role(name="18+", color=discord.Color.dark_gray())

    await enforce_role_hierarchy(guild)

    everyone = guild.default_role

    def ro_ow():
        return {everyone: discord.PermissionOverwrite(send_messages=False, add_reactions=True)}

    def staff_ow():
        ow = {everyone: discord.PermissionOverwrite(read_messages=False)}
        for r in staff_objs.values(): ow[r] = discord.PermissionOverwrite(read_messages=True, send_messages=True)
        return ow

    existing_ch_names = {c.name for c in guild.channels}

    for cat_name, channels in CHANNELS:
        cat = discord.utils.get(guild.categories, name=cat_name) or await guild.create_category(cat_name)
        for ch_name, topic, read_only in channels:
            if ch_name not in existing_ch_names:
                ch = await guild.create_text_channel(ch_name, category=cat, topic=topic,
                                                      overwrites=ro_ow() if read_only else {})
                save_channel(guild.id, ch_name, ch.id)
            else:
                ch = discord.utils.get(guild.text_channels, name=ch_name)
                if ch: save_channel(guild.id, ch_name, ch.id)

    for cat_name, channels in STAFF_CHANNELS:
        cat = discord.utils.get(guild.categories, name=cat_name) or await guild.create_category(cat_name, overwrites=staff_ow())
        for ch_name, topic, _ in channels:
            if ch_name not in existing_ch_names:
                ch = await guild.create_text_channel(ch_name, category=cat, topic=topic, overwrites=staff_ow())
                save_channel(guild.id, ch_name, ch.id)
            else:
                ch = discord.utils.get(guild.text_channels, name=ch_name)
                if ch: save_channel(guild.id, ch_name, ch.id)

    stats_cat = discord.utils.get(guild.categories, name="📊 server stats")
    if not stats_cat:
        stats_cat = await guild.create_category("📊 server stats",
            overwrites={everyone: discord.PermissionOverwrite(connect=False)})
        await stats_cat.create_voice_channel(f"👥 Members: {guild.member_count}")
        await stats_cat.create_voice_channel(f"🟢 Online: 0")
    set_config(guild.id, stats_category_id=stats_cat.id)

    ticket_cat = discord.utils.get(guild.categories, name="🎫 tickets")
    if not ticket_cat:
        ticket_cat = await guild.create_category("🎫 tickets",
            overwrites={everyone: discord.PermissionOverwrite(read_messages=False)})
    set_config(guild.id, ticket_category_id=ticket_cat.id)

    rules_ch = discord.utils.get(guild.text_channels, name="rules")
    if rules_ch:
        save_channel(guild.id, "rules", rules_ch.id)
        history = [m async for m in rules_ch.history(limit=1)]
        if not history:
            file, embed = await make_rules_banner()
            rm = await rules_ch.send(file=file, embed=embed)
            await rm.add_reaction("✅")

    roles_ch = discord.utils.get(guild.text_channels, name="get-roles")
    role_msg_id = None; ping_msg_id = None
    if roles_ch:
        save_channel(guild.id, "get-roles", roles_ch.id)
        history = [m async for m in roles_ch.history(limit=1)]
        if not history:
            file1, embed1 = await make_roles_banner()
            for emoji, name, desc in SELF_ROLES:
                embed1.add_field(name=f"{emoji} {name}", value=desc, inline=True)
            embed1.add_field(name="🔞 18+", value="Unlocks adult channels", inline=True)
            rm1 = await roles_ch.send(file=file1, embed=embed1)
            for emoji, _, __ in SELF_ROLES: await rm1.add_reaction(emoji)
            await rm1.add_reaction("🔞")
            role_msg_id = rm1.id

            file2, embed2 = await make_roles_banner()
            embed2.description = "react to get pinged for what you actually care about.\n\u200b"
            embed2.clear_fields()
            for emoji, name, desc in PING_ROLES:
                embed2.add_field(name=f"{emoji} {name}", value=desc, inline=True)
            rm2 = await roles_ch.send(file=file2, embed=embed2)
            for emoji, _, __ in PING_ROLES: await rm2.add_reaction(emoji)
            ping_msg_id = rm2.id

    vent_ch = discord.utils.get(guild.text_channels, name="vent-lounge")
    if vent_ch: await vent_ch.edit(slowmode_delay=10)

    audit_id     = get_channel_id(guild.id, "audit-log")
    confess_id   = get_channel_id(guild.id, "confessions")
    starboard_id = get_channel_id(guild.id, "starboard")
    birthday_id  = get_channel_id(guild.id, "birthdays")

    conn = db_connect()
    conn.execute("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)", (guild.id,))
    update_kwargs = dict(xp_enabled=1, automod_enabled=0,
        audit_channel_id=audit_id, confess_channel_id=confess_id,
        starboard_channel_id=starboard_id, birthday_channel_id=birthday_id)
    if role_msg_id: update_kwargs["role_message_id"] = role_msg_id
    if ping_msg_id: update_kwargs["ping_message_id"] = ping_msg_id
    sets = ", ".join(f"{k}=?" for k in update_kwargs)
    conn.execute(f"UPDATE guild_config SET {sets} WHERE guild_id=?", list(update_kwargs.values()) + [guild.id])
    conn.commit(); conn.close()

    await enforce_channel_perms(guild)

    await interaction.followup.send("✅ **New Beginnings is set up!** 🌱 No existing channels were touched.", ephemeral=True)

# ══════════════════════════════════════════════════════════════════════════════
# TICKET SYSTEM
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="ticket", description="Open a support ticket 🎫")
@app_commands.describe(reason="What do you need help with?")
async def ticket(interaction: discord.Interaction, reason: str = "No reason given"):
    cfg    = get_config(interaction.guild_id)
    cat_id = cfg.get("ticket_category_id")
    cat    = interaction.guild.get_channel(cat_id) if cat_id else None

    conn = db_connect()
    existing = conn.execute("SELECT * FROM tickets WHERE guild_id=? AND user_id=? AND open=1", (interaction.guild_id, interaction.user.id)).fetchone()
    conn.close()
    if existing:
        await interaction.response.send_message("❌ You already have an open ticket!", ephemeral=True); return

    everyone    = interaction.guild.default_role
    staff_roles = [discord.utils.get(interaction.guild.roles, name=n) for n, _ in STAFF_ROLES]
    staff_roles = [r for r in staff_roles if r]

    overwrite = {
        everyone: discord.PermissionOverwrite(read_messages=False),
        interaction.user: discord.PermissionOverwrite(read_messages=True, send_messages=True),
    }
    for r in staff_roles:
        overwrite[r] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

    ch_name = f"ticket-{interaction.user.name[:20].lower()}"
    if cat:
        ticket_ch = await cat.create_text_channel(ch_name, overwrites=overwrite)
    else:
        ticket_ch = await interaction.guild.create_text_channel(ch_name, overwrites=overwrite)

    embed = discord.Embed(
        title="🎫 ticket opened",
        description=(
            f"hey {interaction.user.mention}, staff will be with you shortly.\n\n"
            f"**Reason:** {reason}\n\n"
            f"use `/closeticket` when resolved."
        ),
        color=discord.Color.from_str("#7c3aed"),
        timestamp=discord.utils.utcnow()
    )
    embed.set_footer(text="New Beginnings Support")
    await ticket_ch.send(embed=embed)

    conn = db_connect()
    conn.execute("INSERT INTO tickets (guild_id, user_id, thread_id, open, created_at) VALUES (?,?,?,1,?)",
                 (interaction.guild_id, interaction.user.id, ticket_ch.id, datetime.datetime.utcnow().isoformat()))
    conn.commit(); conn.close()

    e = discord.Embed(title="🎫 Ticket opened", color=discord.Color.blurple(), timestamp=discord.utils.utcnow())
    e.add_field(name="User", value=str(interaction.user))
    e.add_field(name="Reason", value=reason)
    await _log(interaction.guild, e)

    await interaction.response.send_message(f"✅ Ticket created: {ticket_ch.mention}", ephemeral=True)

@bot.tree.command(name="closeticket", description="Close a support ticket (mod or ticket owner)")
async def closeticket(interaction: discord.Interaction):
    conn    = db_connect()
    ticket  = conn.execute("SELECT * FROM tickets WHERE guild_id=? AND thread_id=? AND open=1",
                           (interaction.guild_id, interaction.channel_id)).fetchone()
    if not ticket:
        conn.close()
        await interaction.response.send_message("❌ This isn't an open ticket channel.", ephemeral=True); return

    is_staff = interaction.user.guild_permissions.kick_members
    is_owner = ticket["user_id"] == interaction.user.id
    if not is_staff and not is_owner:
        conn.close()
        await interaction.response.send_message("❌ Only staff or the ticket owner can close this.", ephemeral=True); return

    conn.execute("UPDATE tickets SET open=0 WHERE id=?", (ticket["id"],))
    conn.commit(); conn.close()

    await interaction.response.send_message("🔒 Ticket closing in 5 seconds…")
    await asyncio.sleep(5)
    try: await interaction.channel.delete()
    except: pass

# ══════════════════════════════════════════════════════════════════════════════
# PERM ENFORCEMENT COMMANDS
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="fixperms", description="Re-enforce all channel permissions (admin only)")
async def fixperms(interaction: discord.Interaction):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("❌ Admins only.", ephemeral=True); return
    await interaction.response.send_message("🔧 Re-enforcing permissions…", ephemeral=True)
    await enforce_channel_perms(interaction.guild)
    await enforce_role_hierarchy(interaction.guild)
    await interaction.followup.send("✅ Done! All channel perms and role hierarchy enforced.", ephemeral=True)

@bot.tree.command(name="lockdown", description="Lock or unlock a channel (mod only)")
@app_commands.choices(action=[app_commands.Choice(name="lock", value="lock"), app_commands.Choice(name="unlock", value="unlock")])
async def lockdown(interaction: discord.Interaction, action: app_commands.Choice[str]):
    if not interaction.user.guild_permissions.manage_channels:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    everyone = interaction.guild.default_role
    if action.value == "lock":
        await interaction.channel.set_permissions(everyone, send_messages=False)
        embed = discord.Embed(title="🔒 Channel Locked", description=f"{interaction.channel.mention} has been locked.",
                               color=discord.Color.red(), timestamp=discord.utils.utcnow())
        await interaction.response.send_message(embed=embed)
        await _log(interaction.guild, embed)
    else:
        if interaction.channel.name in READ_ONLY_CHANNELS:
            await interaction.channel.set_permissions(everyone, send_messages=False, add_reactions=True)
        else:
            await interaction.channel.set_permissions(everyone, send_messages=None)
        embed = discord.Embed(title="🔓 Channel Unlocked", description=f"{interaction.channel.mention} is back open.",
                               color=discord.Color.green(), timestamp=discord.utils.utcnow())
        await interaction.response.send_message(embed=embed)

# ══════════════════════════════════════════════════════════════════════════════
# FUN COMMANDS
# ══════════════════════════════════════════════════════════════════════════════
EIGHT_BALL = ["It is certain.","Without a doubt.","Yes, definitely!","You may rely on it.",
              "Most likely.","Outlook good.","Signs point to yes.","Reply hazy, try again.",
              "Ask again later.","Better not tell you now.","Cannot predict now.",
              "Don't count on it.","My reply is no.","My sources say no.",
              "Outlook not so good.","Very doubtful."]

@bot.tree.command(name="8ball", description="Ask the magic 8-ball")
@app_commands.describe(question="Your question")
async def eightball(interaction: discord.Interaction, question: str):
    embed = discord.Embed(color=discord.Color.from_str("#7c3aed"))
    embed.add_field(name="❓ Question", value=question, inline=False)
    embed.add_field(name="🎱 Answer",   value=random.choice(EIGHT_BALL), inline=False)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="coinflip", description="Flip a coin")
async def coinflip(interaction: discord.Interaction):
    await interaction.response.send_message(random.choice(["🪙 **Heads!**", "🪙 **Tails!**"]))

@bot.tree.command(name="roll", description="Roll dice e.g. 2d6")
@app_commands.describe(dice="e.g. 1d6, 2d20")
async def roll(interaction: discord.Interaction, dice: str = "1d6"):
    try:
        parts = dice.lower().split("d"); count = min(max(1, int(parts[0])), 20); sides = int(parts[1])
        rolls = [random.randint(1, sides) for _ in range(count)]
        await interaction.response.send_message(f"🎲 `{dice}`: {', '.join(map(str,rolls))} = **{sum(rolls)}**")
    except:
        await interaction.response.send_message("❌ Use format like `1d6` or `2d20`.", ephemeral=True)

@bot.tree.command(name="hug")
@app_commands.describe(member="Who to hug")
async def hug(interaction: discord.Interaction, member: discord.Member):
    await interaction.response.send_message(random.choice([
        f"🤗 {interaction.user.mention} wraps {member.mention} in a big warm hug!",
        f"💛 {member.mention} gets a cozy hug from {interaction.user.mention}!",
        f"🫂 {interaction.user.mention} squeezes {member.mention} tight!",
    ]))

@bot.tree.command(name="pat")
@app_commands.describe(member="Who to pat")
async def pat(interaction: discord.Interaction, member: discord.Member):
    await interaction.response.send_message(f"👋 {interaction.user.mention} gives {member.mention} a gentle head pat~ ✨")

@bot.tree.command(name="ship")
@app_commands.describe(person1="First person", person2="Second person")
async def ship(interaction: discord.Interaction, person1: discord.Member, person2: discord.Member):
    score = random.randint(0, 100)
    bar   = "❤️" * (score // 10) + "🤍" * (10 - score // 10)
    await interaction.response.send_message(f"💘 **{person1.display_name}** + **{person2.display_name}**\n{bar} **{score}%**")

@bot.tree.command(name="pp")
@app_commands.describe(member="Who to measure")
async def pp(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user; size = random.randint(0, 15)
    await interaction.response.send_message(f"📏 {target.mention}: `8{'=' * size}D` ({size} cm)")

@bot.tree.command(name="howgay")
@app_commands.describe(member="Who to check")
async def howgay(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user; score = random.randint(0, 100)
    bar = "🌈" * (score // 10) + "⬜" * (10 - score // 10)
    await interaction.response.send_message(f"🌈 {target.mention} is **{score}% gay**\n{bar}")

@bot.tree.command(name="rps", description="Rock Paper Scissors")
@app_commands.choices(choice=[
    app_commands.Choice(name="Rock", value="rock"),
    app_commands.Choice(name="Paper", value="paper"),
    app_commands.Choice(name="Scissors", value="scissors"),
])
async def rps(interaction: discord.Interaction, choice: app_commands.Choice[str]):
    bot_pick = random.choice(["rock","paper","scissors"])
    icons    = {"rock":"🪨","paper":"📄","scissors":"✂️"}
    beats    = {"rock":"scissors","paper":"rock","scissors":"paper"}
    result   = "Tie! 🤝" if choice.value == bot_pick else ("You win! 🎉" if beats[choice.value] == bot_pick else "I win! 😎")
    await interaction.response.send_message(f"{icons[choice.value]} vs {icons[bot_pick]} — {result}")

# ══════════════════════════════════════════════════════════════════════════════
# PROFILE & ECONOMY
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="setprofile")
@app_commands.describe(bio="Your bio", pronouns="Your pronouns", age="Your age", color="Hex color e.g. #7c3aed")
async def setprofile(interaction: discord.Interaction, bio: str = None, pronouns: str = None, age: str = None, color: str = None):
    conn = db_connect()
    conn.execute("INSERT OR IGNORE INTO profiles (guild_id, user_id) VALUES (?,?)", (interaction.guild_id, interaction.user.id))
    if bio:      conn.execute("UPDATE profiles SET bio=? WHERE guild_id=? AND user_id=?",      (bio[:200], interaction.guild_id, interaction.user.id))
    if pronouns: conn.execute("UPDATE profiles SET pronouns=? WHERE guild_id=? AND user_id=?", (pronouns[:30], interaction.guild_id, interaction.user.id))
    if age:      conn.execute("UPDATE profiles SET age=? WHERE guild_id=? AND user_id=?",      (age[:10], interaction.guild_id, interaction.user.id))
    if color:    conn.execute("UPDATE profiles SET color=? WHERE guild_id=? AND user_id=?",    (color, interaction.guild_id, interaction.user.id))
    conn.commit(); conn.close()
    await interaction.response.send_message("✅ Profile updated!", ephemeral=True)

@bot.tree.command(name="profile")
@app_commands.describe(member="Who to look up")
async def profile(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user
    conn   = db_connect()
    p      = conn.execute("SELECT * FROM profiles WHERE guild_id=? AND user_id=?", (interaction.guild_id, target.id)).fetchone()
    conn.close(); ud = get_user(interaction.guild_id, target.id); p = dict(p) if p else {}
    try: color = discord.Color(int(p.get("color","#7c3aed").lstrip("#"), 16))
    except: color = discord.Color.from_str("#7c3aed")
    embed = discord.Embed(title=f"🌱 {target.display_name}", color=color)
    embed.set_thumbnail(url=target.display_avatar.url)
    embed.add_field(name="Pronouns", value=p.get("pronouns","Not set"), inline=True)
    embed.add_field(name="Age",      value=p.get("age","Not set"),      inline=True)
    embed.add_field(name="Bio",      value=p.get("bio","No bio yet."),  inline=False)
    embed.add_field(name="Level",    value=str(ud["level"]),            inline=True)
    embed.add_field(name="XP",       value=f"{ud['xp']}/{xp_for_level(ud['level'])}", inline=True)
    embed.add_field(name="Coins",    value=f"🪙 {ud['coins']}",         inline=True)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="level")
@app_commands.describe(member="Who to check")
async def level_cmd(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user; ud = get_user(interaction.guild_id, target.id)
    needed = xp_for_level(ud["level"]); filled = int((ud["xp"] / needed) * 20)
    bar    = "█" * filled + "░" * (20 - filled)
    embed  = discord.Embed(title=f"⭐ {target.display_name}",
                           description=f"**Level {ud['level']}** `{bar}` {ud['xp']}/{needed} XP",
                           color=discord.Color.gold())
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="leaderboard")
async def leaderboard(interaction: discord.Interaction):
    conn = db_connect()
    rows = conn.execute("SELECT * FROM users WHERE guild_id=? ORDER BY level DESC, xp DESC LIMIT 10", (interaction.guild_id,)).fetchall()
    conn.close()
    if not rows: await interaction.response.send_message("No XP data yet!", ephemeral=True); return
    medals = ["🥇","🥈","🥉"]; lines = []
    for i, row in enumerate(rows):
        member = interaction.guild.get_member(row["user_id"])
        name   = member.display_name if member else f"User {row['user_id']}"
        medal  = medals[i] if i < 3 else f"**{i+1}.**"
        lines.append(f"{medal} {name} — Level {row['level']} ({row['xp']} XP)")
    embed = discord.Embed(title="🏆 Leaderboard", description="\n".join(lines), color=discord.Color.gold())
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="balance")
@app_commands.describe(member="Who to check")
async def balance(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user; ud = get_user(interaction.guild_id, target.id)
    await interaction.response.send_message(f"🪙 **{target.display_name}** has **{ud['coins']} coins**.")

@bot.tree.command(name="daily")
async def daily(interaction: discord.Interaction):
    ud = get_user(interaction.guild_id, interaction.user.id)
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    if ud.get("last_daily") == today:
        await interaction.response.send_message("❌ Already claimed today. Come back tomorrow!", ephemeral=True); return
    reward = random.randint(50, 150)
    update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] + reward, last_daily=today)
    await interaction.response.send_message(f"🪙 Claimed **{reward} coins**! Total: **{ud['coins'] + reward}**")

@bot.tree.command(name="give")
@app_commands.describe(member="Who to give to", amount="How many coins")
async def give(interaction: discord.Interaction, member: discord.Member, amount: int):
    if amount <= 0: await interaction.response.send_message("❌ Amount must be positive.", ephemeral=True); return
    giver = get_user(interaction.guild_id, interaction.user.id)
    receiver = get_user(interaction.guild_id, member.id)
    if giver["coins"] < amount: await interaction.response.send_message("❌ Not enough coins.", ephemeral=True); return
    update_user(interaction.guild_id, interaction.user.id, coins=giver["coins"] - amount)
    update_user(interaction.guild_id, member.id, coins=receiver["coins"] + amount)
    await interaction.response.send_message(f"🪙 {interaction.user.mention} gave **{amount} coins** to {member.mention}!")

# ══════════════════════════════════════════════════════════════════════════════
# UTILITY COMMANDS
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="poll")
@app_commands.describe(question="Poll question", options="Options separated by | e.g. Yes|No|Maybe")
async def poll(interaction: discord.Interaction, question: str, options: str = "Yes|No"):
    opt_list = [o.strip() for o in options.split("|")][:10]
    number_emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"]
    embed = discord.Embed(title=f"📊 {question}", color=discord.Color.blurple(), timestamp=discord.utils.utcnow())
    embed.description = "\n".join(f"{number_emojis[i]} {opt}" for i, opt in enumerate(opt_list))
    embed.set_footer(text=f"Poll by {interaction.user.display_name}")
    await interaction.response.send_message(embed=embed)
    msg = await interaction.original_response()
    for i in range(len(opt_list)): await msg.add_reaction(number_emojis[i])

@bot.tree.command(name="remind")
@app_commands.describe(time="When e.g. 10m, 2h, 1d", reminder="What to remind you about")
async def remind(interaction: discord.Interaction, time: str, reminder: str):
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    match = re.match(r"(\d+)([smhd])", time.lower())
    if not match: await interaction.response.send_message("❌ Use format like `10m`, `2h`, `1d`.", ephemeral=True); return
    amount, unit = int(match.group(1)), match.group(2)
    due_time = (datetime.datetime.utcnow() + datetime.timedelta(seconds=amount * multipliers[unit])).isoformat()
    conn = db_connect()
    conn.execute("INSERT INTO reminders (user_id, channel_id, guild_id, message, due) VALUES (?,?,?,?,?)",
                 (interaction.user.id, interaction.channel_id, interaction.guild_id, reminder, due_time))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"⏰ I'll remind you about **{reminder}** in **{time}**.", ephemeral=True)

@bot.tree.command(name="afk")
@app_commands.describe(reason="Why you're AFK")
async def afk(interaction: discord.Interaction, reason: str = "AFK"):
    conn = db_connect()
    conn.execute("INSERT OR REPLACE INTO afk (guild_id, user_id, reason, set_at) VALUES (?,?,?,?)",
                 (interaction.guild_id, interaction.user.id, reason, discord.utils.utcnow().isoformat()))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"💤 AFK set: **{reason}**")

@bot.tree.command(name="setbirthday")
@app_commands.describe(month="Month (1–12)", day="Day (1–31)")
async def setbirthday(interaction: discord.Interaction, month: int, day: int):
    if not (1 <= month <= 12 and 1 <= day <= 31):
        await interaction.response.send_message("❌ Invalid date.", ephemeral=True); return
    conn = db_connect()
    conn.execute("INSERT OR REPLACE INTO birthdays (guild_id, user_id, month, day) VALUES (?,?,?,?)",
                 (interaction.guild_id, interaction.user.id, month, day))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"🎂 Birthday set to **{month}/{day}**!", ephemeral=True)

@bot.tree.command(name="birthday")
@app_commands.describe(member="Who to check")
async def birthday(interaction: discord.Interaction, member: discord.Member = None):
    target = member or interaction.user
    conn   = db_connect()
    row    = conn.execute("SELECT * FROM birthdays WHERE guild_id=? AND user_id=?", (interaction.guild_id, target.id)).fetchone()
    conn.close()
    if not row: await interaction.response.send_message(f"❌ {target.display_name} hasn't set a birthday."); return
    month_name = datetime.date(2000, row["month"], row["day"]).strftime("%B %d")
    await interaction.response.send_message(f"🎂 {target.display_name}'s birthday is **{month_name}**!")

@bot.tree.command(name="giveaway")
@app_commands.describe(prize="What's being given away", duration="e.g. 10m, 2h, 1d", winners="Number of winners")
async def giveaway(interaction: discord.Interaction, prize: str, duration: str, winners: int = 1):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    multipliers = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    match = re.match(r"(\d+)([smhd])", duration.lower())
    if not match: await interaction.response.send_message("❌ Use format like `10m`, `2h`.", ephemeral=True); return
    amount, unit = int(match.group(1)), match.group(2)
    ends_at  = (datetime.datetime.utcnow() + datetime.timedelta(seconds=amount * multipliers[unit])).isoformat()
    ends_fmt = discord.utils.utcnow() + datetime.timedelta(seconds=amount * multipliers[unit])
    embed = discord.Embed(title=f"🎉 GIVEAWAY — {prize}",
                          description=f"React with 🎉 to enter!\n\n**Winners:** {winners}\n**Ends:** <t:{int(ends_fmt.timestamp())}:R>\n**Hosted by:** {interaction.user.mention}",
                          color=discord.Color.gold(), timestamp=ends_fmt)
    embed.set_footer(text="Ends at")
    await interaction.response.send_message("🎉 Giveaway started!", ephemeral=True)
    msg = await interaction.channel.send(embed=embed)
    await msg.add_reaction("🎉")
    conn = db_connect()
    conn.execute("INSERT INTO giveaways (guild_id, channel_id, message_id, host_id, prize, winners, ends_at) VALUES (?,?,?,?,?,?,?)",
                 (interaction.guild_id, interaction.channel_id, msg.id, interaction.user.id, prize, winners, ends_at))
    conn.commit(); conn.close()

# ══════════════════════════════════════════════════════════════════════════════
# MODERATION
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="warn")
@app_commands.describe(member="Member to warn", reason="Reason")
async def warn(interaction: discord.Interaction, member: discord.Member, reason: str):
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    conn = db_connect()
    conn.execute("INSERT INTO warnings (guild_id, user_id, reason, mod, timestamp) VALUES (?,?,?,?,?)",
                 (interaction.guild_id, member.id, reason, str(interaction.user), discord.utils.utcnow().strftime("%Y-%m-%d %H:%M UTC")))
    conn.commit()
    count = conn.execute("SELECT COUNT(*) as c FROM warnings WHERE guild_id=? AND user_id=?", (interaction.guild_id, member.id)).fetchone()["c"]
    conn.close()
    try: await member.send(f"⚠️ Warning in **{interaction.guild.name}**: {reason}")
    except: pass
    e = discord.Embed(title="⚠️ Member warned", color=discord.Color.yellow(), timestamp=discord.utils.utcnow())
    e.add_field(name="Member", value=str(member)); e.add_field(name="Reason", value=reason, inline=False)
    await _log(interaction.guild, e)
    await interaction.response.send_message(f"⚠️ {member.mention} warned. Total: **{count}**")

@bot.tree.command(name="warnings")
@app_commands.describe(member="Member to check")
async def view_warnings(interaction: discord.Interaction, member: discord.Member):
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    conn  = db_connect()
    wlist = conn.execute("SELECT * FROM warnings WHERE guild_id=? AND user_id=?", (interaction.guild_id, member.id)).fetchall()
    conn.close()
    if not wlist: await interaction.response.send_message(f"✅ {member.mention} has no warnings.", ephemeral=True); return
    embed = discord.Embed(title=f"⚠️ Warnings for {member.display_name}", color=discord.Color.yellow())
    for i, w in enumerate(wlist, 1):
        embed.add_field(name=f"#{i} — {w['timestamp']}", value=f"**Reason:** {w['reason']}\n**By:** {w['mod']}", inline=False)
    await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name="clearwarnings")
@app_commands.describe(member="Member to clear")
async def clearwarnings(interaction: discord.Interaction, member: discord.Member):
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    conn = db_connect(); conn.execute("DELETE FROM warnings WHERE guild_id=? AND user_id=?", (interaction.guild_id, member.id))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"✅ Cleared warnings for {member.mention}.", ephemeral=True)

@bot.tree.command(name="kick")
@app_commands.describe(member="Member", reason="Reason")
async def kick(interaction: discord.Interaction, member: discord.Member, reason: str = "No reason given"):
    if not interaction.user.guild_permissions.kick_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await member.kick(reason=reason)
    e = discord.Embed(title="👢 Kicked", color=discord.Color.orange(), timestamp=discord.utils.utcnow())
    e.add_field(name="Member", value=str(member)); e.add_field(name="Reason", value=reason)
    await _log(interaction.guild, e)
    await interaction.response.send_message(f"✅ Kicked {member.mention}.")

@bot.tree.command(name="ban")
@app_commands.describe(member="Member", reason="Reason")
async def ban(interaction: discord.Interaction, member: discord.Member, reason: str = "No reason given"):
    if not interaction.user.guild_permissions.ban_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await member.ban(reason=reason)
    e = discord.Embed(title="🔨 Banned", color=discord.Color.red(), timestamp=discord.utils.utcnow())
    e.add_field(name="Member", value=str(member)); e.add_field(name="Reason", value=reason)
    await _log(interaction.guild, e)
    await interaction.response.send_message(f"✅ Banned {member.mention}.")

@bot.tree.command(name="timeout")
@app_commands.describe(member="Member", minutes="Duration in minutes")
async def timeout_cmd(interaction: discord.Interaction, member: discord.Member, minutes: int = 10):
    if not interaction.user.guild_permissions.moderate_members:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await member.timeout(discord.utils.utcnow() + datetime.timedelta(minutes=minutes))
    await interaction.response.send_message(f"✅ {member.mention} timed out for {minutes}m.")

@bot.tree.command(name="clear")
@app_commands.describe(amount="How many (max 100)")
async def clear(interaction: discord.Interaction, amount: int = 10):
    if not interaction.user.guild_permissions.manage_messages:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await interaction.response.defer(ephemeral=True)
    deleted = await interaction.channel.purge(limit=min(amount, 100))
    await interaction.followup.send(f"✅ Deleted {len(deleted)} messages.", ephemeral=True)

@bot.tree.command(name="giverole")
@app_commands.describe(member="Member", role="Role")
async def giverole(interaction: discord.Interaction, member: discord.Member, role: discord.Role):
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await member.add_roles(role)
    await interaction.response.send_message(f"✅ Gave **{role.name}** to {member.mention}.", ephemeral=True)

@bot.tree.command(name="removerole")
@app_commands.describe(member="Member", role="Role")
async def removerole(interaction: discord.Interaction, member: discord.Member, role: discord.Role):
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    await member.remove_roles(role)
    await interaction.response.send_message(f"✅ Removed **{role.name}** from {member.mention}.", ephemeral=True)

@bot.tree.command(name="automod")
@app_commands.describe(action="enable/disable/addword/removeword/list", word="Word to add or remove")
@app_commands.choices(action=[
    app_commands.Choice(name="enable", value="enable"), app_commands.Choice(name="disable", value="disable"),
    app_commands.Choice(name="addword", value="addword"), app_commands.Choice(name="removeword", value="removeword"),
    app_commands.Choice(name="list", value="list"),
])
async def automod_cmd(interaction: discord.Interaction, action: app_commands.Choice[str], word: str = None):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("❌ Admins only.", ephemeral=True); return
    conn = db_connect(); conn.execute("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)", (interaction.guild_id,)); conn.commit()
    if action.value in ("enable","disable"):
        val = 1 if action.value == "enable" else 0
        conn.execute("UPDATE guild_config SET automod_enabled=? WHERE guild_id=?", (val, interaction.guild_id))
        conn.commit(); conn.close()
        await interaction.response.send_message(f"✅ Automod {'enabled' if val else 'disabled'}.", ephemeral=True)
    elif action.value == "addword":
        if not word: conn.close(); await interaction.response.send_message("❌ Provide a word.", ephemeral=True); return
        conn.execute("INSERT OR IGNORE INTO automod_words (guild_id, word) VALUES (?,?)", (interaction.guild_id, word.lower()))
        conn.commit(); conn.close()
        await interaction.response.send_message(f"✅ Added `{word}`.", ephemeral=True)
    elif action.value == "removeword":
        if not word: conn.close(); await interaction.response.send_message("❌ Provide a word.", ephemeral=True); return
        conn.execute("DELETE FROM automod_words WHERE guild_id=? AND word=?", (interaction.guild_id, word.lower()))
        conn.commit(); conn.close()
        await interaction.response.send_message(f"✅ Removed `{word}`.", ephemeral=True)
    elif action.value == "list":
        cfg   = conn.execute("SELECT automod_enabled FROM guild_config WHERE guild_id=?", (interaction.guild_id,)).fetchone()
        words = [r["word"] for r in conn.execute("SELECT word FROM automod_words WHERE guild_id=?", (interaction.guild_id,)).fetchall()]
        conn.close()
        status = "enabled" if (cfg and cfg["automod_enabled"]) else "disabled"
        await interaction.response.send_message(f"🤖 Automod **{status}**. Words: {', '.join(f'`{w}`' for w in words) or 'None'}", ephemeral=True)

@bot.tree.command(name="setauditlog")
@app_commands.describe(channel="Channel for logs")
async def setauditlog(interaction: discord.Interaction, channel: discord.TextChannel):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("❌ Admins only.", ephemeral=True); return
    set_config(interaction.guild_id, audit_channel_id=channel.id)
    await interaction.response.send_message(f"✅ Audit log → {channel.mention}.", ephemeral=True)

@bot.tree.command(name="setstarboard")
@app_commands.describe(channel="Starboard channel", threshold="Stars needed")
async def setstarboard(interaction: discord.Interaction, channel: discord.TextChannel, threshold: int = 3):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("❌ Admins only.", ephemeral=True); return
    set_config(interaction.guild_id, starboard_channel_id=channel.id, starboard_threshold=threshold)
    await interaction.response.send_message(f"✅ Starboard → {channel.mention} ({threshold} ⭐).", ephemeral=True)

@bot.tree.command(name="xpcontrol")
@app_commands.describe(action="toggle/setxp/addxp/resetxp", member="Target member", amount="XP amount")
@app_commands.choices(action=[
    app_commands.Choice(name="toggle", value="toggle"), app_commands.Choice(name="setxp", value="setxp"),
    app_commands.Choice(name="addxp", value="addxp"),  app_commands.Choice(name="resetxp", value="resetxp"),
])
async def xp_admin(interaction: discord.Interaction, action: app_commands.Choice[str], member: discord.Member = None, amount: int = None):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("❌ No permission.", ephemeral=True); return
    gid = interaction.guild_id
    if action.value == "toggle":
        cfg = get_config(gid); new = 0 if cfg["xp_enabled"] else 1; set_config(gid, xp_enabled=new)
        await interaction.response.send_message(f"✅ XP {'enabled' if new else 'disabled'}.", ephemeral=True)
    elif action.value in ("setxp","addxp"):
        if not member or amount is None: await interaction.response.send_message("❌ Provide member and amount.", ephemeral=True); return
        ud = get_user(gid, member.id)
        newxp = amount if action.value == "setxp" else ud["xp"] + amount
        update_user(gid, member.id, xp=newxp)
        await interaction.response.send_message(f"✅ {member.mention}'s XP → **{newxp}**.", ephemeral=True)
    elif action.value == "resetxp":
        if not member: await interaction.response.send_message("❌ Provide a member.", ephemeral=True); return
        conn = db_connect(); conn.execute("UPDATE users SET xp=0, level=1, coins=0 WHERE guild_id=? AND user_id=?", (gid, member.id)); conn.commit(); conn.close()
        await interaction.response.send_message(f"✅ Reset {member.mention}.", ephemeral=True)

@bot.tree.command(name="serverinfo")
async def serverinfo(interaction: discord.Interaction):
    g = interaction.guild
    embed = discord.Embed(title=f"🌱 {g.name}", color=discord.Color.from_str("#7c3aed"))
    embed.add_field(name="Members",  value=g.member_count)
    embed.add_field(name="Channels", value=len(g.text_channels))
    embed.add_field(name="Roles",    value=len(g.roles))
    embed.add_field(name="Owner",    value=g.owner.mention if g.owner else "Unknown")
    embed.set_footer(text=f"Created {g.created_at.strftime('%b %d, %Y')}")
    if g.icon: embed.set_thumbnail(url=g.icon.url)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="ping")
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message(f"🏓 Pong! `{round(bot.latency * 1000)}ms`")

@bot.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    try: await interaction.response.send_message(f"❌ Error: {error}", ephemeral=True)
    except: pass

# ══════════════════════════════════════════════════════════════════════════════
# COIN SHOP
# ══════════════════════════════════════════════════════════════════════════════
SHOP_CATALOG = {
    "color":     {"name": "🎨 Custom Color Role",    "cost": 500,  "desc": "Get a role with any hex color you pick"},
    "pin":       {"name": "📌 Pin a Message",         "cost": 150,  "desc": "Bot pins your next message for 24h"},
    "prophecy":  {"name": "🔮 AI Prophecy",           "cost": 50,   "desc": "Receive an unhinged AI prophecy about yourself"},
    "nickname":  {"name": "🎭 Nickname Hijack",       "cost": 200,  "desc": "Change someone's nickname for 1 hour"},
    "custping":  {"name": "🔔 Custom Ping Role",      "cost": 300,  "desc": "Create one @mention role with your chosen name"},
    "spotlight": {"name": "🌟 Spotlight",             "cost": 400,  "desc": "Your profile gets posted in general for 24h"},
    "lootbox":   {"name": "🎰 Loot Box",              "cost": 100,  "desc": "Random reward: coins, a role, or a curse"},
    "gamble":    {"name": "💸 Coinflip Gamble",       "cost": 0,    "desc": "Double or nothing — bet any amount"},
    "crown":     {"name": "👑 Server Crown",          "cost": 1000, "desc": "Temporary 'Most Powerful' role for 48h"},
}

@bot.tree.command(name="shop", description="Browse the coin shop 🛍️")
async def shop(interaction: discord.Interaction):
    embed = discord.Embed(title="🛍️ Coin Shop", color=discord.Color.from_str("#7c3aed"),
                          description="Use `/buy <item>` to purchase.\n\u200b")
    for key, item in SHOP_CATALOG.items():
        cost_str = f"🪙 {item['cost']}" if item['cost'] > 0 else "🪙 variable"
        embed.add_field(name=f"{item['name']} — {cost_str}", value=f"`/buy {key}` · {item['desc']}", inline=False)
    ud = get_user(interaction.guild_id, interaction.user.id)
    embed.set_footer(text=f"Your balance: 🪙 {ud['coins']}")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="buy", description="Purchase a shop item 🛍️")
@app_commands.describe(item="Item key from /shop", arg="Extra argument (color hex, target user, amount, etc.)")
async def buy(interaction: discord.Interaction, item: str, arg: str = None):
    item = item.lower().strip()
    if item not in SHOP_CATALOG:
        await interaction.response.send_message("❌ Unknown item. Check `/shop` for valid items.", ephemeral=True); return
    catalog = SHOP_CATALOG[item]
    ud      = get_user(interaction.guild_id, interaction.user.id)

    if item == "gamble":
        if not arg or not arg.isdigit():
            await interaction.response.send_message("❌ Usage: `/buy gamble 200` (specify amount to bet)", ephemeral=True); return
        bet = int(arg)
        if bet <= 0: await interaction.response.send_message("❌ Bet must be positive.", ephemeral=True); return
        if ud["coins"] < bet: await interaction.response.send_message(f"❌ Not enough coins. You have 🪙 {ud['coins']}.", ephemeral=True); return
        win = random.random() < 0.5
        delta = bet if win else -bet
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] + delta)
        result = f"🎉 You **won** 🪙 {bet}! New balance: 🪙 {ud['coins'] + delta}" if win else f"💀 You **lost** 🪙 {bet}. New balance: 🪙 {ud['coins'] + delta}"
        await interaction.response.send_message(f"🪙 Coinflip — {'HEADS' if win else 'TAILS'}!\n{result}")
        return

    cost = catalog["cost"]
    if ud["coins"] < cost:
        await interaction.response.send_message(f"❌ Not enough coins. You need 🪙 {cost}, you have 🪙 {ud['coins']}.", ephemeral=True); return

    guild = interaction.guild
    now   = datetime.datetime.utcnow()

    if item == "color":
        if not arg or not re.match(r"^#[0-9a-fA-F]{6}$", arg):
            await interaction.response.send_message("❌ Provide a hex color e.g. `/buy color #ff69b4`", ephemeral=True); return
        try:
            color = discord.Color(int(arg.lstrip("#"), 16))
        except: await interaction.response.send_message("❌ Invalid hex color.", ephemeral=True); return
        role_name = f"✨ {interaction.user.display_name}"
        existing  = discord.utils.get(guild.roles, name=role_name)
        if existing: await existing.delete()
        role = await guild.create_role(name=role_name, color=color, mentionable=False)
        await interaction.user.add_roles(role)
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        await interaction.response.send_message(f"🎨 Created your color role **{role_name}** in `{arg}`! 🪙 -{cost}")

    elif item == "pin":
        conn = db_connect()
        conn.execute("INSERT INTO shop_purchases (guild_id, user_id, item, data, expires_at, created_at) VALUES (?,?,?,?,?,?)",
            (interaction.guild_id, interaction.user.id, "pin", "pending",
             (now + datetime.timedelta(hours=1)).isoformat(), now.isoformat()))
        conn.commit(); conn.close()
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        await interaction.response.send_message(f"📌 Your next message in this channel will be pinned for 24h! 🪙 -{cost}", ephemeral=True)

    elif item == "prophecy":
        await interaction.response.defer()
        prompt = (f"You are an unhinged, cryptic, overly dramatic oracle. Give a prophecy about a Discord user named "
                  f"'{interaction.user.display_name}'. Make it absurd, funny, and weirdly specific. 2-3 sentences max.")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("https://text.pollinations.ai/", json={"messages":[{"role":"user","content":prompt}],
                    "model":"openai","seed":random.randint(1,99999)}, timeout=aiohttp.ClientTimeout(total=15)) as r:
                    prophecy = await r.text()
        except: prophecy = "The stars are silent. Try again when Mercury is no longer in retrograde. 🌑"
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        embed = discord.Embed(title="🔮 The Oracle Speaks", description=prophecy.strip()[:500],
                              color=discord.Color.from_str("#4c1d95"), timestamp=discord.utils.utcnow())
        embed.set_footer(text=f"Prophecy for {interaction.user.display_name}")
        await interaction.followup.send(embed=embed)

    elif item == "nickname":
        if not arg: await interaction.response.send_message("❌ Usage: `/buy nickname @user NewNickname`", ephemeral=True); return
        parts = arg.split(" ", 1)
        if len(parts) < 2: await interaction.response.send_message("❌ Usage: `/buy nickname @UserID NewNickname`", ephemeral=True); return
        try:
            target_id = int(parts[0].strip("<@!>"))
            target    = guild.get_member(target_id)
        except: await interaction.response.send_message("❌ Couldn't find that member.", ephemeral=True); return
        if not target: await interaction.response.send_message("❌ Member not found.", ephemeral=True); return
        if target.top_role >= interaction.user.top_role and interaction.user.id != guild.owner_id:
            await interaction.response.send_message("❌ You can't hijack someone with a higher role than you!", ephemeral=True); return
        new_nick  = parts[1][:32]
        old_nick  = target.display_name
        expires   = (now + datetime.timedelta(hours=1)).isoformat()
        try: await target.edit(nick=new_nick, reason=f"Nickname hijack by {interaction.user}")
        except discord.Forbidden: await interaction.response.send_message("❌ I can't change that person's nickname.", ephemeral=True); return
        conn = db_connect()
        conn.execute("INSERT INTO shop_purchases (guild_id, user_id, item, data, expires_at, created_at) VALUES (?,?,?,?,?,?)",
            (interaction.guild_id, target.id, "nickname_restore", old_nick, expires, now.isoformat()))
        conn.commit(); conn.close()
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        await interaction.response.send_message(f"🎭 Changed **{old_nick}**'s nickname to **{new_nick}** for 1 hour! 🪙 -{cost}")

    elif item == "custping":
        if not arg: await interaction.response.send_message("❌ Usage: `/buy custping RoleName`", ephemeral=True); return
        role_name = arg[:50]
        if discord.utils.get(guild.roles, name=role_name):
            await interaction.response.send_message("❌ That role already exists.", ephemeral=True); return
        role = await guild.create_role(name=role_name, mentionable=True, reason=f"Custom ping by {interaction.user}")
        await interaction.user.add_roles(role)
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        await interaction.response.send_message(f"🔔 Created mentionable role **{role_name}**! Others can ask staff to give it to them. 🪙 -{cost}")

    elif item == "spotlight":
        general = discord.utils.get(guild.text_channels, name="general")
        if not general: await interaction.response.send_message("❌ No #general channel found.", ephemeral=True); return
        p   = db_connect().execute("SELECT * FROM profiles WHERE guild_id=? AND user_id=?", (interaction.guild_id, interaction.user.id)).fetchone()
        p   = dict(p) if p else {}
        xud = get_user(interaction.guild_id, interaction.user.id)
        try: color = discord.Color(int(p.get("color","#7c3aed").lstrip("#"), 16))
        except: color = discord.Color.from_str("#7c3aed")
        embed = discord.Embed(title=f"🌟 SPOTLIGHT — {interaction.user.display_name}", color=color,
                              description=f"*This member bought the spotlight!*\n\n{p.get('bio','No bio set.')}",
                              timestamp=discord.utils.utcnow())
        embed.set_thumbnail(url=interaction.user.display_avatar.url)
        embed.add_field(name="Pronouns", value=p.get("pronouns","—"), inline=True)
        embed.add_field(name="Level",    value=str(xud["level"]),      inline=True)
        embed.add_field(name="Coins",    value=f"🪙 {xud['coins']}",   inline=True)
        embed.set_footer(text="🌟 Spotlight lasts 24 hours")
        await general.send(f"✨ Everyone give {interaction.user.mention} some love!", embed=embed)
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        await interaction.response.send_message(f"🌟 You're in the spotlight! 🪙 -{cost}", ephemeral=True)

    elif item == "lootbox":
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        roll = random.random()
        if roll < 0.40:
            reward = random.randint(50, 300)
            update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost + reward)
            result = f"💰 You found **{reward} coins**!"
        elif roll < 0.65:
            bonus = random.randint(50, 200)
            xud   = get_user(interaction.guild_id, interaction.user.id)
            update_user(interaction.guild_id, interaction.user.id, xp=xud["xp"] + bonus)
            result = f"⭐ You got **{bonus} bonus XP**!"
        elif roll < 0.80:
            role_name = random.choice(list(LEVEL_ROLES.values()))
            role = discord.utils.get(guild.roles, name=role_name) or await guild.create_role(name=role_name)
            await interaction.user.add_roles(role)
            result = f"🎭 You got the **{role_name}** role!"
        elif roll < 0.92:
            result = "🕳️ The loot box was... **empty**. Tragic."
        else:
            curses = ["🤡 Clown", "🥔 Potato", "🦆 Quacker", "👻 Spooky", "🧸 Stuffed Animal"]
            curse  = random.choice(curses)
            try: await interaction.user.edit(nick=curse, reason="Loot box curse!")
            except: pass
            expires = (now + datetime.timedelta(minutes=30)).isoformat()
            conn = db_connect()
            conn.execute("INSERT INTO shop_purchases (guild_id, user_id, item, data, expires_at, created_at) VALUES (?,?,?,?,?,?)",
                (interaction.guild_id, interaction.user.id, "nickname_restore", interaction.user.display_name, expires, now.isoformat()))
            conn.commit(); conn.close()
            result = f"😈 **CURSED!** Your nickname is now **{curse}** for 30 minutes. GG."
        embed = discord.Embed(title="🎰 Loot Box Opened!", description=result,
                              color=discord.Color.gold(), timestamp=discord.utils.utcnow())
        await interaction.response.send_message(embed=embed)

    elif item == "crown":
        crown_role = discord.utils.get(guild.roles, name="👑 Most Powerful")
        if not crown_role:
            crown_role = await guild.create_role(name="👑 Most Powerful",
                color=discord.Color.from_str("#f59e0b"), mentionable=True, hoist=True)
        for m in guild.members:
            if crown_role in m.roles:
                await m.remove_roles(crown_role, reason="Crown expired/taken")
        await interaction.user.add_roles(crown_role)
        expires = (now + datetime.timedelta(hours=48)).isoformat()
        conn = db_connect()
        conn.execute("INSERT INTO shop_purchases (guild_id, user_id, item, data, expires_at, created_at) VALUES (?,?,?,?,?,?)",
            (interaction.guild_id, interaction.user.id, "crown", "active", expires, now.isoformat()))
        conn.commit(); conn.close()
        update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
        general = discord.utils.get(guild.text_channels, name="general")
        if general:
            await general.send(f"👑 **{interaction.user.mention}** has claimed the **Server Crown** for 48 hours. Bow down. 🫡")
        await interaction.response.send_message(f"👑 You are now the Most Powerful. Enjoy it while it lasts. 🪙 -{cost}", ephemeral=True)

@tasks.loop(minutes=5)
async def check_shop_expirations():
    now  = datetime.datetime.utcnow().isoformat()
    conn = db_connect()
    rows = conn.execute("SELECT * FROM shop_purchases WHERE expires_at <= ? AND expires_at IS NOT NULL", (now,)).fetchall()
    for row in rows:
        guild = bot.get_guild(row["guild_id"])
        if not guild: continue
        if row["item"] == "nickname_restore":
            member = guild.get_member(row["user_id"])
            if member:
                try: await member.edit(nick=row["data"] if row["data"] != member.display_name else None, reason="Shop expiry")
                except: pass
        elif row["item"] == "crown":
            crown_role = discord.utils.get(guild.roles, name="👑 Most Powerful")
            member     = guild.get_member(row["user_id"])
            if crown_role and member:
                try: await member.remove_roles(crown_role, reason="Crown expired")
                except: pass
        conn.execute("DELETE FROM shop_purchases WHERE id=?", (row["id"],))
    conn.commit(); conn.close()

@bot.event
async def on_message_pin_check(message: discord.Message):
    if message.author.bot: return
    conn = db_connect()
    row  = conn.execute(
        "SELECT * FROM shop_purchases WHERE guild_id=? AND user_id=? AND item=? AND data=?",
        (message.guild.id, message.author.id, "pin", "pending")
    ).fetchone()
    if row:
        try:
            await message.pin(reason="Shop purchase: pin")
            expires = (datetime.datetime.utcnow() + datetime.timedelta(hours=24)).isoformat()
            conn.execute("UPDATE shop_purchases SET data=?, expires_at=? WHERE id=?",
                         (str(message.id), expires, row["id"]))
            conn.commit()
        except: pass
    conn.close()

# ══════════════════════════════════════════════════════════════════════════════
# SERVER PET 🐣
# ══════════════════════════════════════════════════════════════════════════════
PET_MOODS = [
    (80, "🥰 Thriving",  "Living the dream. Fed, happy, healthy."),
    (60, "😊 Content",   "Doing pretty well! A little attention goes a long way."),
    (40, "😐 Neutral",   "Just existing. Could use some love."),
    (20, "😟 Struggling","Getting sad and hungry. Please help!"),
    (0,  "😰 Critical",  "On the edge. One bad day away from doom."),
]

def get_pet(guild_id: int) -> dict:
    conn = db_connect(); c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO server_pet (guild_id) VALUES (?)", (guild_id,))
    conn.commit()
    row = c.execute("SELECT * FROM server_pet WHERE guild_id=?", (guild_id,)).fetchone()
    conn.close(); return dict(row)

def pet_mood(pet: dict) -> tuple[str, str]:
    avg = (pet["hunger"] + pet["happiness"] + pet["health"]) // 3
    for threshold, label, desc in PET_MOODS:
        if avg >= threshold: return label, desc
    return PET_MOODS[-1][1], PET_MOODS[-1][2]

@bot.tree.command(name="pet", description="Check on the server pet 🐣")
async def pet_status(interaction: discord.Interaction):
    p = get_pet(interaction.guild_id)
    if not p["alive"]:
        embed = discord.Embed(title=f"💀 {p['name']} has passed away...",
                              description="The server pet died from neglect. Use `/petrevive` to bring them back (costs 🪙 500 from the community).",
                              color=discord.Color.dark_gray())
        await interaction.response.send_message(embed=embed); return
    mood_label, mood_desc = pet_mood(p)
    embed = discord.Embed(title=f"🐣 {p['name']} the Server Pet", color=discord.Color.from_str("#7c3aed"),
                          description=f"**Mood:** {mood_label}\n*{mood_desc}*\n\u200b")
    def bar(val): filled = val // 10; return "█" * filled + "░" * (10 - filled)
    embed.add_field(name="🍖 Hunger",    value=f"`{bar(p['hunger'])}` {p['hunger']}%",    inline=False)
    embed.add_field(name="😄 Happiness", value=f"`{bar(p['happiness'])}` {p['happiness']}%", inline=False)
    embed.add_field(name="❤️ Health",    value=f"`{bar(p['health'])}` {p['health']}%",    inline=False)
    embed.set_footer(text="Use /petfeed and /petplay to keep them happy!")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="petfeed", description="Feed the server pet 🍖")
async def pet_feed(interaction: discord.Interaction):
    p  = get_pet(interaction.guild_id)
    if not p["alive"]:
        await interaction.response.send_message("💀 The pet is dead! Use `/petrevive` first.", ephemeral=True); return
    now     = datetime.datetime.utcnow()
    last    = datetime.datetime.fromisoformat(p["last_fed"]) if p["last_fed"] else datetime.datetime(2000,1,1)
    cooldown_mins = 30
    diff    = (now - last).total_seconds() / 60
    if diff < cooldown_mins:
        await interaction.response.send_message(f"⏳ {p['name']} isn't hungry yet! Come back in {int(cooldown_mins - diff)} minutes.", ephemeral=True); return
    new_hunger = min(100, p["hunger"] + random.randint(15, 25))
    new_health = min(100, p["health"] + 5)
    conn = db_connect()
    conn.execute("UPDATE server_pet SET hunger=?, health=?, last_fed=? WHERE guild_id=?",
                 (new_hunger, new_health, now.isoformat(), interaction.guild_id))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"🍖 You fed **{p['name']}**! Hunger: {p['hunger']}% → {new_hunger}% 🐣")

@bot.tree.command(name="petplay", description="Play with the server pet 🎾")
async def pet_play(interaction: discord.Interaction):
    p  = get_pet(interaction.guild_id)
    if not p["alive"]:
        await interaction.response.send_message("💀 The pet is dead! Use `/petrevive` first.", ephemeral=True); return
    now  = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(p["last_played"]) if p["last_played"] else datetime.datetime(2000,1,1)
    diff = (now - last).total_seconds() / 60
    if diff < 20:
        await interaction.response.send_message(f"⏳ {p['name']} is tired! Come back in {int(20 - diff)} minutes.", ephemeral=True); return
    new_happy = min(100, p["happiness"] + random.randint(15, 30))
    conn = db_connect()
    conn.execute("UPDATE server_pet SET happiness=?, last_played=? WHERE guild_id=?",
                 (new_happy, now.isoformat(), interaction.guild_id))
    conn.commit(); conn.close()
    actions = ["played fetch with", "went on a walk with", "did a puzzle with", "watched anime with", "had a staring contest with"]
    await interaction.response.send_message(f"🎾 {interaction.user.mention} {random.choice(actions)} **{p['name']}**! Happiness: {p['happiness']}% → {new_happy}%")

@bot.tree.command(name="petname", description="Rename the server pet (mod only)")
@app_commands.describe(name="New name for the pet")
async def pet_name(interaction: discord.Interaction, name: str):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("❌ Mods only.", ephemeral=True); return
    conn = db_connect()
    conn.execute("UPDATE server_pet SET name=? WHERE guild_id=?", (name[:32], interaction.guild_id))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"✅ Server pet renamed to **{name}**!")

@bot.tree.command(name="petrevive", description="Pool coins to revive the dead server pet")
async def pet_revive(interaction: discord.Interaction):
    p = get_pet(interaction.guild_id)
    if p["alive"]:
        await interaction.response.send_message(f"✅ {p['name']} is already alive!", ephemeral=True); return
    cost = 200
    ud   = get_user(interaction.guild_id, interaction.user.id)
    if ud["coins"] < cost:
        await interaction.response.send_message(f"❌ Reviving costs 🪙 {cost}. You have 🪙 {ud['coins']}.", ephemeral=True); return
    update_user(interaction.guild_id, interaction.user.id, coins=ud["coins"] - cost)
    conn = db_connect()
    conn.execute("UPDATE server_pet SET alive=1, hunger=50, happiness=50, health=50, death_at=NULL WHERE guild_id=?",
                 (interaction.guild_id,))
    conn.commit(); conn.close()
    await interaction.response.send_message(f"🌱 **{p['name']}** has been revived! 🎉 🪙 -{cost} from {interaction.user.mention}")

@tasks.loop(hours=1)
async def pet_decay():
    conn  = db_connect()
    pets  = conn.execute("SELECT * FROM server_pet WHERE alive=1").fetchall()
    for row in pets:
        p         = dict(row)
        now       = datetime.datetime.utcnow()
        last_fed  = datetime.datetime.fromisoformat(p["last_fed"])  if p["last_fed"]   else datetime.datetime(2000,1,1)
        last_play = datetime.datetime.fromisoformat(p["last_played"]) if p["last_played"] else datetime.datetime(2000,1,1)
        hrs_unfed   = (now - last_fed).total_seconds()  / 3600
        hrs_unplayed = (now - last_play).total_seconds() / 3600
        hunger    = max(0, p["hunger"]    - int(hrs_unfed   * 3))
        happiness = max(0, p["happiness"] - int(hrs_unplayed * 2))
        health    = p["health"]
        if hunger == 0:    health = max(0, health - 10)
        if happiness == 0: health = max(0, health - 5)
        alive = 1 if health > 0 else 0
        conn.execute("UPDATE server_pet SET hunger=?, happiness=?, health=?, alive=?, death_at=? WHERE guild_id=?",
                     (hunger, happiness, health, alive,
                      now.isoformat() if not alive else p.get("death_at"), p["guild_id"]))
        if not alive:
            guild = bot.get_guild(p["guild_id"])
            if guild:
                ch = discord.utils.get(guild.text_channels, name="general")
                if ch:
                    await ch.send(f"💀 **{p['name']}** the server pet has **died** from neglect... 😢\nUse `/petrevive` (costs 🪙 200) to bring them back.")
    conn.commit(); conn.close()

# ══════════════════════════════════════════════════════════════════════════════
# GAMES
# ══════════════════════════════════════════════════════════════════════════════
TRUTHS = [
    "What's the most embarrassing thing you've done in public?",
    "Have you ever ghosted someone? What happened?",
    "What's a secret you've never told anyone here?",
    "What's the weirdest thing you've ever searched online?",
    "Who in this server would you switch lives with for a day?",
    "What's the last lie you told?",
    "What's your most controversial food opinion?",
    "What's a show or movie you pretend you've seen but haven't?",
    "What's something you're lowkey bad at but pretend to be good at?",
    "What's your most unhinged 3am thought?",
]
DARES = [
    "Change your nickname to something embarrassing for 10 minutes.",
    "Send the 10th photo in your camera roll here (no cheating).",
    "Write a love poem for the person above you right now.",
    "Type your next 3 messages using only emojis.",
    "Confess something using /confess right now.",
    "React to the last 5 messages with increasingly unhinged emojis.",
    "Describe yourself in 3 words — your most honest self.",
    "Rate everyone currently online 1-10 on vibes only.",
    "Send a voice message saying something kind to the server.",
    "Start a random poll about something completely unimportant.",
]

@bot.tree.command(name="tod", description="Truth or Dare 🎲")
@app_commands.choices(choice=[
    app_commands.Choice(name="Truth", value="truth"),
    app_commands.Choice(name="Dare",  value="dare"),
    app_commands.Choice(name="Random",value="random"),
])
async def truth_or_dare(interaction: discord.Interaction, choice: app_commands.Choice[str]):
    pick = choice.value if choice.value != "random" else random.choice(["truth","dare"])
    text = random.choice(TRUTHS if pick == "truth" else DARES)
    color = discord.Color.from_str("#7c3aed") if pick == "truth" else discord.Color.from_str("#c62828")
    icon  = "🔮" if pick == "truth" else "🔥"
    embed = discord.Embed(title=f"{icon} {'TRUTH' if pick == 'truth' else 'DARE'}",
                          description=f"**{interaction.user.mention}:**\n\n{text}",
                          color=color, timestamp=discord.utils.utcnow())
    embed.set_footer(text="Use /tod to play again!")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="vibecheck", description="Put someone's vibe on trial 🔍")
@app_commands.describe(member="Who to vibe check (leave blank for a random active member)")
async def vibe_check(interaction: discord.Interaction, member: discord.Member = None):
    if not member:
        candidates = [m for m in interaction.guild.members if not m.bot and m.id != interaction.user.id]
        member = random.choice(candidates) if candidates else interaction.user
    embed = discord.Embed(
        title="🔍 VIBE CHECK",
        description=f"The server is putting **{member.mention}**'s vibe on trial.\n\nCast your votes below!",
        color=discord.Color.from_str("#7c3aed"),
        timestamp=discord.utils.utcnow()
    )
    embed.set_thumbnail(url=member.display_avatar.url)
    embed.set_footer(text=f"Vibe check called by {interaction.user.display_name}")
    await interaction.response.send_message(embed=embed)
    msg = await interaction.original_response()
    for emoji in ["✅","❌","🤔","🔥","💀","🌟"]:
        await msg.add_reaction(emoji)

@bot.tree.command(name="guessmember", description="Can you guess who we're talking about? 🕵️")
async def guess_member(interaction: discord.Interaction):
    members = [m for m in interaction.guild.members if not m.bot]
    if len(members) < 3:
        await interaction.response.send_message("❌ Need at least 3 non-bot members.", ephemeral=True); return
    target = random.choice(members)
    now    = datetime.datetime.utcnow()

    clues = []
    if (now - target.joined_at.replace(tzinfo=None)).days > 30:
        clues.append("📅 This person has been in the server for **more than 30 days**.")
    else:
        clues.append("📅 This person joined the server **within the last 30 days**.")
    clues.append(f"🔤 Their display name is **{len(target.display_name)} characters** long.")
    clues.append(f"🎭 They have **{len(target.roles) - 1} roles** (excluding @everyone).")
    clues.append("🖼️ They have a **custom avatar**." if str(target.display_avatar).startswith("https://cdn.discordapp.com/avatars") else "🖼️ They use a **default avatar**.")

    embed = discord.Embed(
        title="🕵️ Guess the Member!",
        description="Figure out who we're talking about based on these clues:\n\u200b",
        color=discord.Color.from_str("#4f46e5"),
        timestamp=discord.utils.utcnow()
    )
    for i, clue in enumerate(clues, 1):
        embed.add_field(name=f"Clue {i}", value=clue, inline=False)
    embed.set_footer(text=f"Answer: ||{target.display_name}|| (spoiler — highlight to reveal)")
    await interaction.response.send_message(embed=embed)

# ══════════════════════════════════════════════════════════════════════════════
# WORD OF THE DAY
# ══════════════════════════════════════════════════════════════════════════════
WORD_BANK = [
    ("Sonder",       "The realization that each passerby has a life as vivid and complex as your own."),
    ("Hiraeth",      "A homesickness for a home you can't return to, or that never was."),
    ("Ephemeral",    "Lasting for a very short time; transitory."),
    ("Liminal",      "Relating to a transitional or initial stage; in between states."),
    ("Solipsism",    "The idea that only one's own mind is sure to exist."),
    ("Petrichor",    "The pleasant earthy smell after rain."),
    ("Serendipity",  "The occurrence of happy events by chance."),
    ("Vellichor",    "The strange wistfulness of used bookshops."),
    ("Oneiric",      "Relating to dreams or dreaming."),
    ("Catharsis",    "The process of releasing strong or repressed emotions."),
    ("Oblivion",     "The state of being unaware or unconscious of what is happening."),
    ("Schadenfreude","Pleasure derived from another's misfortune."),
    ("Ineffable",    "Too great or extreme to be expressed in words."),
    ("Lacuna",       "A missing portion; a gap or blank space."),
    ("Melancholy",   "A deep, pensive sadness with no obvious cause."),
]

@tasks.loop(hours=1)
async def post_word_of_day():
    now = datetime.datetime.utcnow()
    if now.hour != 10: return
    today = now.strftime("%Y-%m-%d")
    conn  = db_connect()
    for guild in bot.guilds:
        row = conn.execute("SELECT * FROM word_of_day WHERE guild_id=?", (guild.id,)).fetchone()
        if row and row["posted_date"] == today: continue
        word, definition = random.choice(WORD_BANK)
        ch = discord.utils.get(guild.text_channels, name="general")
        if not ch: continue
        embed = discord.Embed(
            title=f"📖 Word of the Day — *{word}*",
            description=f"**Definition:** {definition}\n\n*Challenge: use this word naturally in conversation today!*",
            color=discord.Color.from_str("#4f46e5"),
            timestamp=discord.utils.utcnow()
        )
        embed.set_footer(text="New word every day at 10am UTC")
        await ch.send(embed=embed)
        conn.execute("INSERT OR REPLACE INTO word_of_day (guild_id, word, definition, posted_date) VALUES (?,?,?,?)",
                     (guild.id, word, definition, today))
        conn.commit()
    conn.close()

# ══════════════════════════════════════════════════════════════════════════════
# CONFESSIONS
# ══════════════════════════════════════════════════════════════════════════════
@bot.tree.command(name="confess", description="Post an anonymous confession 🤫")
@app_commands.describe(confession="Your confession")
async def confess(interaction: discord.Interaction, confession: str):
    cfg   = get_config(interaction.guild_id)
    ch_id = cfg.get("confess_channel_id") or get_channel_id(interaction.guild_id, "confessions")
    ch    = interaction.guild.get_channel(ch_id) if ch_id else discord.utils.get(interaction.guild.text_channels, name="confessions")
    if not ch: await interaction.response.send_message("❌ No confessions channel found.", ephemeral=True); return
    embed = discord.Embed(title="🤫 Anonymous Confession", description=confession,
                          color=discord.Color.from_str("#7c3aed"), timestamp=discord.utils.utcnow())
    embed.set_footer(text="👍 upvote · 👎 downvote · ⭐ star to send to starboard")
    msg = await ch.send(embed=embed)
    for emoji in ["👍","👎","⭐"]: await msg.add_reaction(emoji)
    await interaction.response.send_message("✅ Posted anonymously!", ephemeral=True)

# ══════════════════════════════════════════════════════════════════════════════
# COMMUNITY EVENTS
# ══════════════════════════════════════════════════════════════════════════════
class EventSignupView(discord.ui.View):
    def __init__(self, event_id: int):
        super().__init__(timeout=None)
        self.event_id = event_id

    @discord.ui.button(label="✅ Sign Up", style=discord.ButtonStyle.success, custom_id="event_signup")
    async def signup(self, interaction: discord.Interaction, button: discord.ui.Button):
        conn = db_connect()
        exists = conn.execute("SELECT 1 FROM event_signups WHERE event_id=? AND user_id=?",
                              (self.event_id, interaction.user.id)).fetchone()
        if exists:
            conn.execute("DELETE FROM event_signups WHERE event_id=? AND user_id=?",
                         (self.event_id, interaction.user.id))
            conn.commit(); conn.close()
            await interaction.response.send_message("❌ You've withdrawn from the event.", ephemeral=True)
        else:
            conn.execute("INSERT INTO event_signups (event_id, user_id) VALUES (?,?)",
                         (self.event_id, interaction.user.id))
            conn.commit(); conn.close()
            await interaction.response.send_message("✅ You're signed up! See you there.", ephemeral=True)

    @discord.ui.button(label="👥 See Attendees", style=discord.ButtonStyle.secondary, custom_id="event_attendees")
    async def attendees(self, interaction: discord.Interaction, button: discord.ui.Button):
        conn = db_connect()
        rows = conn.execute("SELECT user_id FROM event_signups WHERE event_id=?", (self.event_id,)).fetchall()
        conn.close()
        if not rows:
            await interaction.response.send_message("No one's signed up yet!", ephemeral=True); return
        mentions = []
        for row in rows:
            m = interaction.guild.get_member(row["user_id"])
            mentions.append(m.display_name if m else f"User {row['user_id']}")
        embed = discord.Embed(title="👥 Attendees", description="\n".join(f"• {n}" for n in mentions),
                              color=discord.Color.from_str("#7c3aed"))
        embed.set_footer(text=f"{len(mentions)} signed up")
        await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name="event", description="Create a community event 🎉")
@app_commands.describe(
    title="Event title",
    description="What's happening",
    when="Date and time e.g. 'Saturday 8pm EST' or '2026-05-20 20:00'",
    location="Channel name, VC name, or 'online'",
)
async def create_event(interaction: discord.Interaction, title: str, description: str, when: str, location: str):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("❌ Mods only.", ephemeral=True); return
    await interaction.response.defer()

    conn = db_connect()
    conn.execute("INSERT INTO events (guild_id, host_id, title, description, location, event_time, channel_id) VALUES (?,?,?,?,?,?,?)",
                 (interaction.guild_id, interaction.user.id, title, description, location, when, interaction.channel_id))
    conn.commit()
    event_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()

    embed = discord.Embed(
        title=f"🎉 {title}",
        description=description,
        color=discord.Color.from_str("#f59e0b"),
        timestamp=discord.utils.utcnow()
    )
    embed.add_field(name="📅 When",     value=when,     inline=True)
    embed.add_field(name="📍 Location", value=location, inline=True)
    embed.add_field(name="👤 Host",     value=interaction.user.mention, inline=True)
    embed.set_footer(text="Click ✅ Sign Up to join!")

    view = EventSignupView(event_id)
    msg  = await interaction.channel.send(embed=embed, view=view)

    conn = db_connect()
    conn.execute("UPDATE events SET message_id=? WHERE id=?", (msg.id, event_id))
    conn.commit(); conn.close()

    event_role = discord.utils.get(interaction.guild.roles, name="Event Pings")
    if event_role:
        await interaction.channel.send(f"📣 {event_role.mention} New event just dropped!", delete_after=10)

    await interaction.followup.send("✅ Event created!", ephemeral=True)

@bot.tree.command(name="events", description="List upcoming events 📅")
async def list_events(interaction: discord.Interaction):
    conn  = db_connect()
    rows  = conn.execute("SELECT * FROM events WHERE guild_id=? AND ended=0 ORDER BY id DESC LIMIT 5",
                         (interaction.guild_id,)).fetchall()
    conn.close()
    if not rows:
        await interaction.response.send_message("📅 No upcoming events. Mods can create one with `/event`!", ephemeral=True); return
    embed = discord.Embed(title="📅 Upcoming Events", color=discord.Color.from_str("#f59e0b"))
    for row in rows:
        host   = interaction.guild.get_member(row["host_id"])
        hname  = host.display_name if host else "Unknown"
        conn2  = db_connect()
        count  = conn2.execute("SELECT COUNT(*) as c FROM event_signups WHERE event_id=?", (row["id"],)).fetchone()["c"]
        conn2.close()
        embed.add_field(
            name=f"🎉 {row['title']}",
            value=f"📅 {row['event_time']} · 📍 {row['location']} · 👥 {count} signed up · 👤 {hname}",
            inline=False
        )
    embed.set_footer(text="Sign up using the button on the event post!")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="endevent", description="Mark an event as ended (mod only)")
@app_commands.describe(event_id="Event ID (from /events)")
async def end_event(interaction: discord.Interaction, event_id: int):
    if not interaction.user.guild_permissions.manage_guild:
        await interaction.response.send_message("❌ Mods only.", ephemeral=True); return
    conn = db_connect()
    row  = conn.execute("SELECT * FROM events WHERE id=? AND guild_id=?", (event_id, interaction.guild_id)).fetchone()
    if not row: conn.close(); await interaction.response.send_message("❌ Event not found.", ephemeral=True); return
    conn.execute("UPDATE events SET ended=1 WHERE id=?", (event_id,))
    conn.commit()
    signups = conn.execute("SELECT COUNT(*) as c FROM event_signups WHERE event_id=?", (event_id,)).fetchone()["c"]
    conn.close()
    embed = discord.Embed(title=f"✅ Event Ended — {row['title']}",
                          description=f"**{signups}** people attended.\nThanks to everyone who joined! 🎉",
                          color=discord.Color.green(), timestamp=discord.utils.utcnow())
    await interaction.response.send_message(embed=embed)

@bot.event
async def on_connect():
    conn = db_connect()
    rows = conn.execute("SELECT id FROM events WHERE ended=0").fetchall()
    conn.close()
    for row in rows:
        bot.add_view(EventSignupView(row["id"]))

# ══════════════════════════════════════════════════════════════════════════════
# LEVEL UP EMBED HELPER
# ══════════════════════════════════════════════════════════════════════════════
async def levelup_embed(member: discord.Member, level: int) -> discord.Embed:
    embed = discord.Embed(
        title="⭐ Level Up!",
        description=f"{member.mention} reached **Level {level}**! 🎉",
        color=discord.Color.gold(),
        timestamp=discord.utils.utcnow()
    )
    embed.set_thumbnail(url=member.display_avatar.url)
    return embed

# ══════════════════════════════════════════════════════════════════════════════
# BUG REPORTING (OpenRelay)
# ══════════════════════════════════════════════════════════════════════════════
redis_client = None
if redis and os.getenv('REDIS_URL'):
    try:
        redis_client = redis.Redis(url=os.getenv('REDIS_URL'), decode_responses=True)
        redis_client.ping()
    except:
        redis_client = None

@bot.tree.command(name="report", description="Report a bug or issue with OpenRelay API")
@app_commands.describe(description="Describe the bug or issue you found")
async def report(interaction: discord.Interaction, description: str):
    """Report a bug to OpenRelay"""
    await interaction.response.defer(ephemeral=True)

    if not redis_client:
        await interaction.followup.send("❌ Bug reporting is currently unavailable. Please try again later.", ephemeral=True)
        return

    try:
        report_id = f"discord_{interaction.user.id}_{int(datetime.datetime.utcnow().timestamp())}"

        report_data = {
            'id': report_id,
            'source': 'discord',
            'discord_user_id': str(interaction.user.id),
            'discord_user': str(interaction.user),
            'description': description,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'status': 'pending'
        }

        redis_client.hset(f'bug_report:{report_id}', mapping=report_data)
        redis_client.lpush('bug_reports:queue', report_id)
        redis_client.expire(f'bug_report:{report_id}', 86400 * 30)

        await interaction.followup.send(
            f"✅ Bug report submitted! Thanks for helping improve OpenRelay.\n"
            f"Report ID: `{report_id}`",
            ephemeral=True
        )
    except Exception as e:
        print(f"Error reporting bug: {e}")
        await interaction.followup.send("❌ Failed to submit report. Please try again.", ephemeral=True)

# ══════════════════════════════════════════════════════════════════════════════
# RUN
# ══════════════════════════════════════════════════════════════════════════════
# Setup:
# 1. pip install discord.py aiohttp redis
# 2. Create bot at https://discord.com/developers/applications
# 3. OAuth2 scopes: bot + applications.commands
# 4. Enable Privileged Intents: Server Members, Message Content
# 5. export DISCORD_TOKEN="your_token_here"
# 6. export REDIS_URL="your_redis_url" (for bug reporting)
# 7. python bot/app.py

bot.run(os.getenv('DISCORD_TOKEN', ''))