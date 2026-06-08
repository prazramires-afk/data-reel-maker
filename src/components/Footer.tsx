import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

export const Footer = () => (
  <footer className="border-t border-border mt-20 bg-card/30">
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
      <div>
        <div className="mb-3"><BrandLogo size={28} /></div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Turn statistics, CSVs and rankings into viral TikTok and Reels videos — free, in your browser.
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-3">Templates</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/templates/bar-chart-race" className="hover:text-foreground">Bar Chart Race</Link></li>
          <li><Link to="/templates/gdp-race" className="hover:text-foreground">GDP Race</Link></li>
          <li><Link to="/templates/football-stats" className="hover:text-foreground">Football Stats</Link></li>
          <li><Link to="/templates/top-10" className="hover:text-foreground">Top 10 Countdown</Link></li>
          <li><Link to="/templates/nba-ranking-animation" className="hover:text-foreground">NBA Ranking</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-3">Datasets</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/datasets" className="hover:text-foreground">All datasets</Link></li>
          <li><Link to="/datasets/gdp-countries" className="hover:text-foreground">GDP by Country</Link></li>
          <li><Link to="/datasets/fifa-goals" className="hover:text-foreground">Football Goals</Link></li>
          <li><Link to="/datasets/nba-points" className="hover:text-foreground">NBA Points</Link></li>
          <li><Link to="/datasets/crypto-marketcap" className="hover:text-foreground">Crypto Market Cap</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-3">Tools &amp; Learn</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/tools/csv-to-video" className="hover:text-foreground">CSV to Video</Link></li>
          <li><Link to="/tools/chart-race-generator" className="hover:text-foreground">Chart Race Generator</Link></li>
          <li><Link to="/tools" className="hover:text-foreground">All tools</Link></li>
          <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-3">Company</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/about" className="hover:text-foreground">About</Link></li>
          <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
          <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Data to Video. Made for creators.
    </div>
  </footer>
);