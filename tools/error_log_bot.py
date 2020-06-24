from os import listdir, remove
from os.path import isfile
from discord_webhook import DiscordWebhook

PATH = "error_logs"

def send_webhook(msg):
    webhook = DiscordWebhook(url='https://discordapp.com/api/webhooks/699745801924247582/BJKcA2Dpa5I_ghWJ979BQFqMkVRTFdzihcF_nkJv9UyEJb0TsBVMn4UiXD36UZK-Ch8U', content=f'```bash\n{msg}```')
    response = webhook.execute()

def main():
    data = ""

    for f in listdir(PATH):
        f = open(PATH + "/" + f, 'r')
        if isfile(f.name):
            data = f'{data}{f.read()}'
            remove(f.name)
        else:
            continue

    if len(data) != 0:
        # We need to post to discord
        for x in [data[i:i+1985] for i in range(0, len(data), 1985)]:
            send_webhook(x)
    else:
        send_webhook("No errors encountered during last run.")

main()