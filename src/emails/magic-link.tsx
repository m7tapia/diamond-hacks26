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

interface MagicLinkEmailProps {
  manageUrl: string;
}

export function MagicLinkEmail({ manageUrl }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Market-Alchemy sign-in link</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>🔑 Sign in to Market-Alchemy</Heading>
          <Text style={text}>
            Click the button below to access your alerts. This link takes you
            directly to your Manage My Alerts page — no password required.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={manageUrl}>
              Go to My Alerts →
            </Button>
          </Section>
          <Text style={footer}>
            If you didn&apos;t request this, you can safely ignore this email.
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
