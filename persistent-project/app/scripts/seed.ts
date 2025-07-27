
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test user account
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      name: 'John Doe'
    }
  })

  console.log('Test user created:', testUser.email)

  // Create sample reports
  const sampleReports = [
    {
      originalText: "Dnes som sa cítil skutočne produktívny. Dokončil som tri dôležité projekty a cítim sa spokojný s mojím pokrokom.",
      analysisResult: {
        psychological_analysis: {
          emotional_state: "Pozitívny a spokojný",
          cognitive_patterns: ["Orientácia na výsledky", "Sebahodnotenie cez produktivitu"],
          motivation_drivers: ["Úspech", "Dosiahnutie cieľov"],
          stress_indicators: []
        },
        logical_analysis: {
          reasoning_structure: "Kauzálne spojenie medzi produktivitou a spokojnosťou",
          argument_validity: "Platná",
          logical_fallacies: [],
          conclusion_strength: "Silná"
        },
        syntactic_analysis: {
          language_complexity: "Stredná",
          writing_style: "Priamočiary a jasný",
          sentence_structure: ["Jednoduché vety", "Koordinované spojenia"],
          vocabulary_level: "Štandardná"
        },
        summary: "Pozitívna reflexia produktívneho dňa s jasnou spokojnosťou s dosiahnutými výsledkami.",
        insights: ["Produktivita je kľúčovým faktorom spokojnosti", "Jasné meranie pokroku"],
        recommendations: ["Pokračovať v nastavovaní jasných denných cieľov", "Oslavovať malé víťazstvá"]
      }
    }
  ]

  for (const report of sampleReports) {
    await prisma.report.create({
      data: {
        userId: testUser.id,
        originalText: report.originalText,
        analysisResult: report.analysisResult,
        textLength: report.originalText.length,
        processingTime: Math.floor(Math.random() * 3000) + 1000 // Random processing time 1-4s
      }
    })
  }

  console.log('Sample reports created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
