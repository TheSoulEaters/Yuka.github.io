# ==============================================================================
# File: src/main.py
# Deskripsi: Titik masuk utama untuk bot Discord Yuka.
#            Menginisialisasi bot, memuat cogs, dan mensinkronkan slash commands.
# ==============================================================================

import discord
from discord.ext import commands
from discord import app_commands # Untuk Slash Commands
import os # Untuk mengakses variabel lingkungan
from dotenv import load_dotenv # Untuk memuat file .env

# Import DBManager dari utils
from src.utils.db_manager import DBManager

# --- [1] Inisialisasi Environment Variables ---
# Muat variabel dari file .env di direktori root proyek.
load_dotenv()

# Dapatkan token bot dari variabel lingkungan.
# Jika tidak ditemukan, bot tidak akan bisa berjalan.
BOT_TOKEN = os.getenv('BOT_TOKEN')
if BOT_TOKEN is None:
    print("ERROR: BOT_TOKEN tidak ditemukan di file .env. Bot tidak dapat berjalan.")
    exit(1) # Keluar dari program jika token tidak ditemukan

# Dapatkan DEV_GUILD_ID jika diatur (untuk sinkronisasi perintah di lingkungan dev)
DEV_GUILD_ID = os.getenv('DEV_GUILD_ID')
# Konversi ke discord.Object jika ada
DEV_GUILD_OBJECT = discord.Object(id=int(DEV_GUILD_ID)) if DEV_GUILD_ID else None

# Dapatkan ENVIRONMENT (DEVELOPMENT/PRODUCTION)
ENVIRONMENT = os.getenv('ENVIRONMENT', 'PRODUCTION').upper()


# --- [2] Inisialisasi DBManager Global ---
# Inisialisasi DBManager agar dapat diakses oleh semua cogs.
db_manager = DBManager()


# --- [3] Definisi Kelas Bot Kustom ---
class YukaBot(commands.Bot):
    def __init__(self):
        # Definisi Intents yang diperlukan bot Anda.
        # Intents adalah izin yang diberikan bot untuk menerima event dari Discord.
        intents = discord.Intents.default()
        intents.members = True          # Diperlukan untuk event on_member_join, mengakses informasi member
        intents.message_content = True  # Diperlukan untuk bot yang membaca konten pesan (misal, perintah prefixed, atau AI)
        intents.voice_states = True     # Diperlukan untuk fungsionalitas pemutar musik

        # Inisialisasi Bot dasar dari discord.ext.commands.Bot
        # command_prefix bisa diatur, tapi tidak relevan untuk slash commands.
        super().__init__(command_prefix='!', intents=intents)

        # Inisialisasi CommandTree untuk Slash Commands.
        self.tree = app_commands.CommandTree(self)

        # Pasang instance DBManager ke bot untuk akses dari cogs.
        self.db_manager = db_manager

    # --- [4] setup_hook: Lifecycle Hook Setelah Bot Login ---
    # Fungsi ini akan berjalan setelah bot berhasil login ke Discord,
    # tetapi sebelum event on_ready dipicu. Ini tempat terbaik untuk memuat cogs
    # dan mensinkronkan slash commands.
    async def setup_hook(self):
        print("Loading cogs...")
        # Muat semua cogs dari direktori src/cogs/
        try:
            await self.load_extension('src.cogs.general_cog')
            await self.load_extension('src.cogs.admin_cog')
            await self.load_extension('src.cogs.music_cog')
            # Tambahkan baris di sini untuk setiap cog baru yang Anda buat
            print("All cogs loaded successfully.")
        except Exception as e:
            print(f"Error loading cogs: {e}")

        # Sinkronisasi Slash Commands ke Discord.
        # Strategi sinkronisasi:
        # - DEVELOPMENT: Sinkronkan hanya ke guild spesifik (DEV_GUILD_ID) untuk debugging cepat.
        # - PRODUCTION: Sinkronkan secara global (membutuhkan waktu hingga 1 jam untuk propagasi).
        if ENVIRONMENT == "DEVELOPMENT" and DEV_GUILD_OBJECT:
            print(f"Syncing slash commands to development guild (ID: {DEV_GUILD_OBJECT.id})...")
            # Mensinkronkan hanya ke guild tertentu sangat mempercepat debugging slash commands.
            self.tree.copy_global_to(guild=DEV_GUILD_OBJECT)
            await self.tree.sync(guild=DEV_GUILD_OBJECT)
            print("Slash commands synced to development guild.")
        elif ENVIRONMENT == "PRODUCTION":
            print("Syncing global slash commands (may take up to 1 hour to propagate)...")
            await self.tree.sync() # Sinkronkan semua perintah global
            print("Global slash commands sync initiated.")
        else:
            print("Skipping slash command sync. (Not in development mode or DEV_GUILD_ID not set)")


# --- [5] Inisialisasi Instance Bot ---
bot = YukaBot()


# --- [6] Event Listener: on_ready ---
# Event ini dipicu ketika bot berhasil terhubung dan siap digunakan.
@bot.event
async def on_ready():
    print(f'Logged in as {bot.user.name} ({bot.user.id})')
    print('------')
    # Set status aktivitas bot
    activity = discord.Activity(type=discord.ActivityType.listening, name="/help")
    await bot.change_presence(activity=activity)
    print(f"Bot is ready! Current environment: {ENVIRONMENT}")


# --- [7] Jalankan Bot ---
if __name__ == '__main__':
    # Memastikan BOT_TOKEN tersedia sebelum mencoba menjalankan bot.
    if BOT_TOKEN:
        try:
            bot.run(BOT_TOKEN)
        except discord.LoginFailure:
            print("ERROR: Login gagal. Pastikan BOT_TOKEN Anda benar dan valid.")
        except Exception as e:
            print(f"An unexpected error occurred while running the bot: {e}")
    else:
        print("ERROR: BOT_TOKEN tidak ditemukan. Bot tidak dapat memulai.")