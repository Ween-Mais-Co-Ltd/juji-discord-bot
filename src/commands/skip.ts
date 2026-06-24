import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js'
import { Command } from '../types/command'
import { musicService } from '../music/MusicService'

export default class Skip extends Command {
  data = new SlashCommandBuilder().setName('skip').setDescription('Skip the current song.')

  override cooldown = 3

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const result = await musicService.skip(interaction.guildId)
    if (!result) {
      await interaction.reply({
        content: 'Nothing is playing right now.',
        flags: MessageFlags.Ephemeral,
      })
      return
    }

    const { skipped, next } = result
    await interaction.reply({
      content: next
        ? `⏭️ Skipped **${skipped.title}** — now playing **${next.title}**.`
        : `⏭️ Skipped **${skipped.title}**. The queue is empty, so I'll leave.`,
    })
  }
}
