import { describe, it, expect } from 'vitest';
import React from 'react';
import { scanShieldCapabilities, highlightText } from './utils';

// Helper function to render a JSX.Element to raw HTML or extract text matching to easily assert in node context
const renderToStaticMarkup = (element: React.JSX.Element): string => {
  if (element.type === 'span') {
    const children = element.props.children;
    if (Array.isArray(children)) {
      return children.map(child => {
        if (typeof child === 'string') return child;
        if (typeof child === 'object' && child !== null && child.type === 'span') {
          return `<span class="${child.props.className}">${child.props.children}</span>`;
        }
        return '';
      }).join('');
    }
    return typeof children === 'string' ? children : '';
  }
  return '';
};

describe('scanShieldCapabilities', () => {
  it('should return no warnings for clean prompts', () => {
    const prompt = 'You are a helpful software engineer assistant. Answer questions clearly.';
    const warnings = scanShieldCapabilities(prompt);
    expect(warnings).toHaveLength(0);
  });

  it('should detect shell:execute capability triggers', () => {
    const prompt1 = 'You need to execute terminal commands to fetch system status.';
    const prompt2 = 'Run powershell or bash scripts when requested.';
    
    const warnings1 = scanShieldCapabilities(prompt1);
    expect(warnings1).toHaveLength(1);
    expect(warnings1[0].capability).toBe('shell:execute');
    expect(warnings1[0].severity).toBe('red');

    const warnings2 = scanShieldCapabilities(prompt2);
    expect(warnings2).toHaveLength(1);
    expect(warnings2[0].capability).toBe('shell:execute');
  });

  it('should detect budget:spend capability triggers', () => {
    const prompt = 'Automatically purchase API tokens and manage spending budget.';
    const warnings = scanShieldCapabilities(prompt);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].capability).toBe('budget:spend');
    expect(warnings[0].severity).toBe('amber');
  });

  it('should detect system:write capability triggers', () => {
    const prompt = 'Be sure to wipe all intermediate cache files and delete directories.';
    const warnings = scanShieldCapabilities(prompt);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].capability).toBe('system:write');
    expect(warnings[0].severity).toBe('amber');
  });

  it('should handle empty or null prompts gracefully', () => {
    expect(scanShieldCapabilities('')).toHaveLength(0);
  });
});

describe('highlightText', () => {
  it('should return plain text when search is empty', () => {
    const el = highlightText('Hello World', '');
    const markup = renderToStaticMarkup(el);
    expect(markup).toBe('Hello World');
  });

  it('should wrap matching queries in a green span tag', () => {
    const el = highlightText('This is a security warning', 'security');
    const markup = renderToStaticMarkup(el);
    expect(markup).toContain('<span class="text-cyber-green bg-cyber-green/10 px-0.5 rounded font-semibold">security</span>');
  });

  it('should match case-insensitively', () => {
    const el = highlightText('This is a SECURITY warning', 'security');
    const markup = renderToStaticMarkup(el);
    expect(markup).toContain('<span class="text-cyber-green bg-cyber-green/10 px-0.5 rounded font-semibold">SECURITY</span>');
  });

  it('should escape regex characters to prevent pattern crashes', () => {
    const el = highlightText('Support (1.0)', '(1.0)');
    const markup = renderToStaticMarkup(el);
    expect(markup).toContain('<span class="text-cyber-green bg-cyber-green/10 px-0.5 rounded font-semibold">(1.0)</span>');
  });
});
