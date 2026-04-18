import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { escapeHtml } from './html.util';



export function buildEmailErrorHtml(titel: string, inhoud: string): string {
      let html = fs.readFileSync(`${process.env.TEMPLATE_PATH}/error-email.html`, 'utf8');
      const base64img = fs.readFileSync('./templates/gezc-logo.png', {encoding: 'base64'});

      html = html.replaceAll(/\{base64img}/g, base64img);
      html = html.replaceAll(/\{TITEL}/g, escapeHtml(titel));
      html = html.replaceAll(/\{INHOUD}/g, escapeHtml(inhoud));
      return html;
   }

