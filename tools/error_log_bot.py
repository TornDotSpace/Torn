import discord

from os import listdir, remove
from os.path import isfile
from discord_webhook import DiscordWebhook

data = ""

PATH = "error_logs"

for f in listdir(PATH):
    print(f)
    print(isfile(PATH + "/" + f))
    f = open(PATH + "/" + f, 'r')
    if isfile(f.name):
        data = data + f.read()
        remove(f.name)
    else:
        continue

if len(data) != 0:
    # We need to post to discord
    print(data)
    webhook = DiscordWebhook(url='https://discordapp.com/api/webhooks/699745801924247582/BJKcA2Dpa5I_ghWJ979BQFqMkVRTFdzihcF_nkJv9UyEJb0TsBVMn4UiXD36UZK-Ch8U', content='```' + data + "```")
    response = webhook.execute()
    print(response)