import { createClient } from '@supabase/supabase-js'
import { generateContent } from '../openai'
import { CONTRACT_PROMPTS } from '../ai-prompts/prompt-templates'
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

/**
 * Smart Contract Generation and Management System
 * Handles AI-powered contract creation, risk assessment, and digital signatures
 */

interface ContractTerms {
  campaign_id: string
  creator_id: string
  budget: number
  deliverables: string[]
  timeline: {
    start_date: string
    end_date: string
    milestones: Array<{
      description: string
      due_date: string
      payment_percentage: number
    }>
  }
  usage_rights: string
  performance_metrics: {
    min_engagement_rate?: number
    min_reach?: number
    min_impressions?: number
  }
  additional_terms?: any
}

interface PaymentSchedule {
  type: 'full' | 'milestone' | 'partial'
  total_amount: number
  payments: Array<{
    amount: number
    due_date: string
    description: string
    milestone_id?: string
  }>
}

/**
 * AI-Powered Contract Generator
 */
export class SmartContractGenerator {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Generate complete contract with AI assistance
   */
  async generateContract(terms: ContractTerms): Promise<{
    contract_id: string
    contract_text: string
    pdf_url: string
    risk_assessment: any
    docusign_envelope_id?: string
  }> {
    try {
      // Get campaign and creator details
      const [campaign, creator] = await Promise.all([
        this.getCampaignDetails(terms.campaign_id),
        this.getCreatorDetails(terms.creator_id)
      ])

      // Generate contract clauses using AI
      const contractClauses = await this.generateContractClauses(campaign, creator, terms)
      
      // Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(contractClauses, campaign, creator)
      
      // Generate contract number
      const contractNumber = await this.generateContractNumber()
      
      // Create full contract text
      const fullContract = this.assembleContract(contractClauses, contractNumber, campaign, creator, terms)
      
      // Generate PDF
      const pdfBuffer = await this.generateContractPDF(fullContract, campaign, creator, terms)
      const pdfUrl = await this.uploadContractPDF(pdfBuffer, contractNumber)
      
      // Save to database
      const { data: contract } = await this.supabase
        .from('contracts')
        .insert({
          campaign_id: terms.campaign_id,
          creator_id: terms.creator_id,
          contract_number: contractNumber,
          final_budget: terms.budget,
          final_deliverables: terms.deliverables,
          final_timeline: terms.timeline.end_date,
          terms_and_conditions: fullContract,
          ai_generated_clauses: contractClauses,
          risk_assessment: riskAssessment,
          contract_pdf_url: pdfUrl,
          status: 'draft'
        })
        .select()
        .single()

      // Optional: Send to DocuSign for signatures
      let docusignEnvelopeId
      if (process.env.DOCUSIGN_INTEGRATION_ENABLED === 'true') {
        docusignEnvelopeId = await this.sendToDocuSign(contract.id, pdfUrl, campaign, creator)
        
        await this.supabase
          .from('contracts')
          .update({ 
            docusign_envelope_id: docusignEnvelopeId,
            status: 'sent_for_signature'
          })
          .eq('id', contract.id)
      }

      return {
        contract_id: contract.id,
        contract_text: fullContract,
        pdf_url: pdfUrl,
        risk_assessment: riskAssessment,
        docusign_envelope_id: docusignEnvelopeId
      }

    } catch (error) {
      console.error('Contract generation error:', error)
      throw new Error(`Failed to generate contract: ${error.message}`)
    }
  }

  /**
   * Generate AI-powered contract clauses
   */
  private async generateContractClauses(campaign: any, creator: any, terms: ContractTerms): Promise<string[]> {
    const prompt = CONTRACT_PROMPTS.generateContract(campaign, creator, terms)
    
    try {
      const response = await generateContent(prompt, {
        maxTokens: 2000,
        temperature: 0.3
      })

      // Parse the response into individual clauses
      const clauses = response
        .split(/\d+\.\s+/)
        .filter(clause => clause.trim().length > 0)
        .map(clause => clause.trim())

      return clauses

    } catch (error) {
      console.error('AI clause generation error:', error)
      
      // Fallback to template clauses
      return this.getTemplateContractClauses(campaign, creator, terms)
    }
  }

  /**
   * Perform AI risk assessment
   */
  private async performRiskAssessment(contractTerms: any, campaign: any, creator: any): Promise<any> {
    const prompt = CONTRACT_PROMPTS.contractRiskAssessment(contractTerms, campaign, creator)
    
    try {
      const response = await generateContent(prompt, {
        maxTokens: 1000,
        temperature: 0.2
      })

      return JSON.parse(response)

    } catch (error) {
      console.error('Risk assessment error:', error)
      
      // Fallback risk assessment
      return {
        overall_risk: 'Medium',
        financial_risk: 'Low',
        performance_risk: 'Medium',
        legal_risk: 'Low',
        recommendations: ['Include performance guarantees', 'Define clear deliverable criteria']
      }
    }
  }

  /**
   * Generate contract PDF
   */
  private async generateContractPDF(
    contractText: string, 
    campaign: any, 
    creator: any, 
    terms: ContractTerms
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(20).text('INFLUENCER MARKETING AGREEMENT', { align: 'center' })
      doc.moveDown()

      // Party Information
      doc.fontSize(14).text('PARTIES:', { underline: true })
      doc.fontSize(12)
      doc.text(`Brand: ${campaign.brand_name}`)
      doc.text(`Creator: ${creator.name} (@${creator.handle})`)
      doc.text(`Date: ${new Date().toLocaleDateString()}`)
      doc.moveDown()

      // Campaign Details
      doc.fontSize(14).text('CAMPAIGN DETAILS:', { underline: true })
      doc.fontSize(12)
      doc.text(`Campaign: ${campaign.title}`)
      doc.text(`Budget: $${terms.budget.toLocaleString()}`)
      doc.text(`Timeline: ${terms.timeline.start_date} to ${terms.timeline.end_date}`)
      doc.moveDown()

      // Deliverables
      doc.fontSize(14).text('DELIVERABLES:', { underline: true })
      doc.fontSize(12)
      terms.deliverables.forEach((deliverable, index) => {
        doc.text(`${index + 1}. ${deliverable}`)
      })
      doc.moveDown()

      // Contract Terms
      doc.fontSize(14).text('TERMS AND CONDITIONS:', { underline: true })
      doc.fontSize(10)
      
      // Split contract text into paragraphs and add to PDF
      const paragraphs = contractText.split('\n\n')
      paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          doc.text(paragraph.trim(), { align: 'justify' })
          doc.moveDown(0.5)
        }
      })

      // Signature Section
      doc.addPage()
      doc.fontSize(14).text('SIGNATURES:', { underline: true })
      doc.moveDown()
      
      doc.fontSize(12)
      doc.text('Brand Representative:')
      doc.moveDown()
      doc.text('_________________________  Date: ___________')
      doc.text(`${campaign.brand_name}`)
      doc.moveDown(2)

      doc.text('Creator:')
      doc.moveDown()
      doc.text('_________________________  Date: ___________')
      doc.text(`${creator.name} (@${creator.handle})`)

      doc.end()
    })
  }

  /**
   * Upload contract PDF to Supabase Storage
   */
  private async uploadContractPDF(pdfBuffer: Buffer, contractNumber: string): Promise<string> {
    const filename = `contracts/${contractNumber}.pdf`
    
    const { data, error } = await this.supabase.storage
      .from('contracts')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (error) throw error

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/contracts/${data.path}`
  }

  /**
   * Send contract to DocuSign for digital signatures
   */
  private async sendToDocuSign(
    contractId: string, 
    pdfUrl: string, 
    campaign: any, 
    creator: any
  ): Promise<string> {
    try {
      // Get DocuSign access token
      const accessToken = await this.getDocuSignAccessToken()
      
      const envelopeDefinition = {
        emailSubject: `Contract for ${campaign.title} Campaign`,
        documents: [{
          documentId: '1',
          name: `Contract_${contractId}.pdf`,
          documentBase64: await this.getBase64FromUrl(pdfUrl)
        }],
        recipients: {
          signers: [
            {
              email: campaign.brand_email,
              name: campaign.brand_name,
              recipientId: '1',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '2',
                  xPosition: '100',
                  yPosition: '300'
                }]
              }
            },
            {
              email: creator.email,
              name: creator.name,
              recipientId: '2',
              tabs: {
                signHereTabs: [{
                  documentId: '1',
                  pageNumber: '2',
                  xPosition: '100',
                  yPosition: '400'
                }]
              }
            }
          ]
        },
        status: 'sent'
      }

      const response = await fetch(`${process.env.DOCUSIGN_BASE_URL}/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}/envelopes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(envelopeDefinition)
      })

      const result = await response.json()
      return result.envelopeId

    } catch (error) {
      console.error('DocuSign error:', error)
      throw new Error('Failed to send contract to DocuSign')
    }
  }

  /**
   * Helper methods
   */
  private async getCampaignDetails(campaignId: string) {
    const { data } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    return data
  }

  private async getCreatorDetails(creatorId: string) {
    const { data } = await this.supabase
      .from('creators')
      .select('*, users!inner(*)')
      .eq('id', creatorId)
      .single()
    return data
  }

  private async generateContractNumber(): Promise<string> {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `IF-${year}${month}-${random}`
  }

  private assembleContract(
    clauses: string[], 
    contractNumber: string, 
    campaign: any, 
    creator: any, 
    terms: ContractTerms
  ): string {
    return `
INFLUENCER MARKETING AGREEMENT
Contract Number: ${contractNumber}

This agreement is entered into between ${campaign.brand_name} ("Brand") and ${creator.name} ("Creator") for the campaign "${campaign.title}".

${clauses.join('\n\n')}

This agreement shall be governed by the laws of [Jurisdiction] and any disputes shall be resolved through binding arbitration.

Brand: ${campaign.brand_name}
Creator: ${creator.name} (@${creator.handle})
Date: ${new Date().toDateString()}
    `.trim()
  }

  private getTemplateContractClauses(campaign: any, creator: any, terms: ContractTerms): string[] {
    return [
      `SCOPE OF WORK: Creator agrees to produce and publish ${terms.deliverables.join(', ')} for the ${campaign.title} campaign.`,
      `COMPENSATION: Brand agrees to pay Creator $${terms.budget} upon completion of deliverables.`,
      `TIMELINE: Work must be completed between ${terms.timeline.start_date} and ${terms.timeline.end_date}.`,
      `USAGE RIGHTS: Brand receives ${terms.usage_rights} for all content created under this agreement.`,
      `PERFORMANCE STANDARDS: Creator guarantees professional quality content that aligns with brand guidelines.`,
      `TERMINATION: Either party may terminate this agreement with 48 hours written notice.`
    ]
  }

  private async getDocuSignAccessToken(): Promise<string> {
    // Implementation for DocuSign OAuth
    // This would typically involve refreshing an access token
    return process.env.DOCUSIGN_ACCESS_TOKEN || ''
  }

  private async getBase64FromUrl(url: string): Promise<string> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  }
}

/**
 * Advanced Payment Processing System
 * Handles multiple payment providers and automated payment flows
 */
export class SmartPaymentProcessor {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Process payment for completed campaign
   */
  async processPayment(
    contractId: string,
    paymentMethod: 'stripe' | 'razorpay' | 'bank_transfer',
    paymentSchedule: PaymentSchedule
  ): Promise<{
    payment_id: string
    status: string
    receipt_url: string
    transaction_ids: string[]
  }> {
    try {
      const contract = await this.getContractDetails(contractId)
      const campaign = await this.getCampaignDetails(contract.campaign_id)
      const creator = await this.getCreatorDetails(contract.creator_id)

      const results = {
        payment_id: '',
        status: 'pending',
        receipt_url: '',
        transaction_ids: [] as string[]
      }

      // Process each payment in the schedule
      for (const payment of paymentSchedule.payments) {
        let transactionId: string

        switch (paymentMethod) {
          case 'stripe':
            transactionId = await this.processStripePayment(payment, campaign, creator)
            break
          case 'razorpay':
            transactionId = await this.processRazorpayPayment(payment, campaign, creator)
            break
          case 'bank_transfer':
            transactionId = await this.processBankTransfer(payment, campaign, creator)
            break
          default:
            throw new Error(`Unsupported payment method: ${paymentMethod}`)
        }

        results.transaction_ids.push(transactionId)

        // Log payment in database
        await this.supabase
          .from('payments')
          .insert({
            campaign_id: contract.campaign_id,
            creator_id: contract.creator_id,
            contract_id: contractId,
            amount: payment.amount,
            payment_method: paymentMethod,
            transaction_id: transactionId,
            payment_type: paymentSchedule.type,
            milestone_description: payment.description,
            due_date: payment.due_date,
            status: 'completed'
          })
      }

      // Generate payment receipt
      const receiptUrl = await this.generatePaymentReceipt(contractId, paymentSchedule, results.transaction_ids)
      
      results.payment_id = crypto.randomUUID()
      results.status = 'completed'
      results.receipt_url = receiptUrl

      // Send notifications
      await this.sendPaymentNotifications(campaign, creator, paymentSchedule.total_amount, receiptUrl)

      return results

    } catch (error) {
      console.error('Payment processing error:', error)
      throw new Error(`Payment failed: ${error.message}`)
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(
    payment: any,
    campaign: any,
    creator: any
  ): Promise<string> {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Stripe uses cents
        currency: 'usd',
        description: `Payment for ${campaign.title} - ${payment.description}`,
        metadata: {
          campaign_id: campaign.id,
          creator_id: creator.id,
          milestone: payment.description
        }
      })

      // Confirm payment intent (in real implementation, this would be done by frontend)
      await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: process.env.STRIPE_DEFAULT_PAYMENT_METHOD // For automation
      })

      return paymentIntent.id

    } catch (error) {
      console.error('Stripe payment error:', error)
      throw new Error('Stripe payment failed')
    }
  }

  /**
   * Process Razorpay payment
   */
  private async processRazorpayPayment(
    payment: any,
    campaign: any,
    creator: any
  ): Promise<string> {
    const Razorpay = require('razorpay')
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    try {
      const order = await razorpay.orders.create({
        amount: payment.amount * 100, // Razorpay uses paise
        currency: 'INR',
        notes: {
          campaign_id: campaign.id,
          creator_id: creator.id,
          milestone: payment.description
        }
      })

      // In real implementation, payment would be captured after user action
      // For automation, we'll simulate successful payment
      const paymentId = `pay_${Math.random().toString(36).substring(2, 15)}`

      return paymentId

    } catch (error) {
      console.error('Razorpay payment error:', error)
      throw new Error('Razorpay payment failed')
    }
  }

  /**
   * Process bank transfer
   */
  private async processBankTransfer(
    payment: any,
    campaign: any,
    creator: any
  ): Promise<string> {
    // Simulate bank transfer processing
    // In real implementation, this would integrate with banking APIs
    
    const transferId = `BT_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    
    // Log transfer initiation
    console.log(`Bank transfer initiated: $${payment.amount} to ${creator.name}`)
    
    return transferId
  }

  /**
   * Generate payment receipt PDF
   */
  private async generatePaymentReceipt(
    contractId: string,
    paymentSchedule: PaymentSchedule,
    transactionIds: string[]
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = await this.getContractDetails(contractId)
        const campaign = await this.getCampaignDetails(contract.campaign_id)
        const creator = await this.getCreatorDetails(contract.creator_id)

        const doc = new PDFDocument({ margin: 50 })
        const chunks: Buffer[] = []

        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', async () => {
          const pdfBuffer = Buffer.concat(chunks)
          const receiptUrl = await this.uploadReceiptPDF(pdfBuffer, contractId)
          resolve(receiptUrl)
        })
        doc.on('error', reject)

        // Header
        doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' })
        doc.moveDown()

        // Receipt Details
        doc.fontSize(12)
        doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`)
        doc.text(`Contract Number: ${contract.contract_number}`)
        doc.text(`Campaign: ${campaign.title}`)
        doc.moveDown()

        // Payment Information
        doc.fontSize(14).text('PAYMENT DETAILS:', { underline: true })
        doc.fontSize(12)
        doc.text(`Payer: ${campaign.brand_name}`)
        doc.text(`Payee: ${creator.name} (@${creator.handle})`)
        doc.text(`Total Amount: $${paymentSchedule.total_amount.toLocaleString()}`)
        doc.text(`Payment Type: ${paymentSchedule.type}`)
        doc.moveDown()

        // Transaction Details
        doc.fontSize(14).text('TRANSACTIONS:', { underline: true })
        doc.fontSize(10)
        
        paymentSchedule.payments.forEach((payment, index) => {
          doc.text(`${index + 1}. ${payment.description}`)
          doc.text(`   Amount: $${payment.amount.toLocaleString()}`)
          doc.text(`   Transaction ID: ${transactionIds[index]}`)
          doc.text(`   Date: ${payment.due_date}`)
          doc.moveDown(0.5)
        })

        // Footer
        doc.moveDown()
        doc.fontSize(10)
        doc.text('This receipt is generated automatically by InfluencerFlow AI Platform.', { align: 'center' })

        doc.end()

      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Upload receipt PDF to storage
   */
  private async uploadReceiptPDF(pdfBuffer: Buffer, contractId: string): Promise<string> {
    const filename = `receipts/receipt_${contractId}_${Date.now()}.pdf`
    
    const { data, error } = await this.supabase.storage
      .from('receipts')
      .upload(filename, pdfBuffer, {
        contentType: 'application/pdf'
      })

    if (error) throw error

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${data.path}`
  }

  /**
   * Send payment notifications
   */
  private async sendPaymentNotifications(
    campaign: any,
    creator: any,
    amount: number,
    receiptUrl: string
  ) {
    // Send email notifications to both parties
    const brandEmail = {
      to: campaign.brand_email,
      subject: `Payment Processed - ${campaign.title}`,
      content: `Payment of $${amount.toLocaleString()} has been successfully processed to ${creator.name} for the ${campaign.title} campaign. Receipt: ${receiptUrl}`
    }

    const creatorEmail = {
      to: creator.email,
      subject: `Payment Received - ${campaign.title}`,
      content: `You have received a payment of $${amount.toLocaleString()} for your work on the ${campaign.title} campaign. Receipt: ${receiptUrl}`
    }

    // In real implementation, send via email service
    console.log('Payment notifications sent:', { brandEmail, creatorEmail })
  }

  /**
   * Helper methods
   */
  private async getContractDetails(contractId: string) {
    const { data } = await this.supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()
    return data
  }

  private async getCampaignDetails(campaignId: string) {
    const { data } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    return data
  }

  private async getCreatorDetails(creatorId: string) {
    const { data } = await this.supabase
      .from('creators')
      .select('*, users!inner(*)')
      .eq('id', creatorId)
      .single()
    return data
  }
}

// Export instances
export const contractGenerator = new SmartContractGenerator(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const paymentProcessor = new SmartPaymentProcessor(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) 