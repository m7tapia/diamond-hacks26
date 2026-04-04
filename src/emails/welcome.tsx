import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  manageUrl: string;
}

export function WelcomeEmail({ manageUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Market-Alchemy AI — your deal scout is ready</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>🏆 Welcome to Market-Alchemy AI</Heading>
          <Text style={text}>
            You&apos;re all set! Market-Alchemy will automatically scout Facebook
            Marketplace, OfferUp, Craigslist, and eBay for the best deals — and
            email you rich digests of top-value finds.
          </Text>
          <Text style={text}>
            Get started by adding your first search alert. Tell us what you&apos;re
            looking for, where you are, and how often to check.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={manageUrl}>
              Manage My Alerts →
            </Button>
          </Section>
          <Text style={footer}>
            This link is your personal access — no password needed. Bookmark it or
            find it again in any future email from us.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: '#0f0f0f', fontFamily: 'sans-serif' };
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 24px',
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
};
const heading = { color: '#f59e0b', fontSize: '28px', marginBottom: '16px' };
const text = { color: '#e5e7eb', fontSize: '16px', lineHeight: '24px' };
const button = {
  backgroundColor: '#f59e0b',
  color: '#0f0f0f',
  padding: '12px 28px',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '16px',
  textDecoration: 'none',
  display: 'inline-block',
};
const footer = { color: '#6b7280', fontSize: '13px', marginTop: '32px' };
