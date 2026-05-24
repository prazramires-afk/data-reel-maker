import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border mt-20 bg-card/30">
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
      <div>
        <h3 className="font-bold text-foreground mb-3">Data to Video</h3>
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
          <li><Link to="/templates/population-growth" className="hover:text-foreground">Population Growth</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-3">Learn</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li><Link to="/blog" className="hover:text-foreground">Blog</Link></li>
          <li><Link to="/blog/why-bar-chart-races-go-viral" className="hover:text-foreground">Why bar chart races go viral</Link></li>
          <li><Link to="/blog/best-tiktok-data-visualization-ideas" className="hover:text-foreground">TikTok data ideas</Link></li>
          <li><Link to="/templates" className="hover:text-foreground">All templates</Link></li>
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