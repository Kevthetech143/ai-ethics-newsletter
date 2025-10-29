"use client";

import { useState, useEffect } from "react";

type Article = {
  id: number;
  title: string;
  link: string;
  description: string;
  source_name: string;
  pub_date: string;
  overall_score: number;
  relevance_score: number;
  quality_score: number;
  novelty_score: number;
  reasoning: string;
  human_approved: boolean | null;
  curator_notes: string | null;
  newsletter_item_id: number | null;
};

export default function ReviewDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0.7);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [minScore]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/review/articles?minScore=${minScore}&limit=50`);
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (articleId: number, approved: boolean, notes?: string) => {
    setProcessingId(articleId);
    try {
      const endpoint = approved ? '/api/review/approve' : '/api/review/reject';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, notes })
      });

      if (response.ok) {
        await fetchArticles(); // Refresh list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update article'}`);
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Network error. Please try again.');
    }
    setProcessingId(null);
  };

  const handleSendNewsletter = async () => {
    if (!confirm('Send newsletter to all subscribers? This will email all approved articles that haven\'t been sent yet.')) {
      return;
    }

    setSendingNewsletter(true);
    setSendResult(null);

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (response.ok) {
        setSendResult(`✅ Success! Sent ${result.articleCount} articles to ${result.subscriberCount} subscribers`);
        await fetchArticles(); // Refresh to show sent status
      } else {
        setSendResult(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending newsletter:', error);
      setSendResult('❌ Network error. Please try again.');
    } finally {
      setSendingNewsletter(false);
      setTimeout(() => setSendResult(null), 8000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 font-bold';
    if (score >= 0.7) return 'text-green-500';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading articles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Review Dashboard</h1>
          <p className="mt-2 text-gray-600">Review and approve AI-curated articles for the newsletter</p>

          {/* Filters and Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="text-sm text-gray-700">
              Minimum Score:
              <select
                value={minScore}
                onChange={(e) => setMinScore(parseFloat(e.target.value))}
                className="ml-2 rounded border-gray-300 px-3 py-1.5"
              >
                <option value="0.9">0.90+ (Exceptional)</option>
                <option value="0.8">0.80+ (Excellent)</option>
                <option value="0.7">0.70+ (Good)</option>
                <option value="0.6">0.60+ (Fair)</option>
                <option value="0.5">0.50+ (All)</option>
              </select>
            </label>
            <span className="text-sm text-gray-500">
              Showing {articles.length} articles
            </span>

            {/* Send Newsletter Button */}
            <button
              onClick={handleSendNewsletter}
              disabled={sendingNewsletter}
              className="ml-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingNewsletter ? '📤 Sending...' : '📨 Send Newsletter'}
            </button>
          </div>

          {/* Send Result Message */}
          {sendResult && (
            <div className={`mt-3 p-3 rounded-lg ${
              sendResult.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {sendResult}
            </div>
          )}
        </div>
      </div>

      {/* Articles List */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                article.human_approved
                  ? 'border-green-500 bg-green-50'
                  : article.human_approved === false
                  ? 'border-red-300 opacity-60'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Article Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="font-medium">{article.source_name}</span>
                    <span>•</span>
                    <span>{new Date(article.pub_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Score Badge */}
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(article.overall_score)}`}>
                    {article.overall_score.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Overall</div>
                </div>
              </div>

              {/* Scores Breakdown */}
              <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Relevance</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {article.relevance_score.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Quality</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {article.quality_score.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Novelty</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {article.novelty_score.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs font-semibold text-blue-900 uppercase mb-2">
                  AI Reasoning
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{article.reasoning}</p>
              </div>

              {/* Description */}
              {article.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{article.description}</p>
                </div>
              )}

              {/* Curator Notes */}
              {article.curator_notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="text-xs font-semibold text-yellow-900 uppercase mb-1">
                    Curator Notes
                  </div>
                  <p className="text-sm text-gray-700">{article.curator_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleApprove(article.id, true)}
                  disabled={processingId === article.id || article.human_approved === true}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                    article.human_approved === true
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                  }`}
                >
                  {article.human_approved === true ? '✓ Approved' : 'Approve for Newsletter'}
                </button>
                <button
                  onClick={() => handleApprove(article.id, false)}
                  disabled={processingId === article.id || article.human_approved === false}
                  className="flex-1 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  {article.human_approved === false ? 'Rejected' : 'Reject'}
                </button>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  Read Article →
                </a>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No articles found matching the criteria.</p>
              <p className="text-sm text-gray-400 mt-2">
                Try lowering the minimum score threshold.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
