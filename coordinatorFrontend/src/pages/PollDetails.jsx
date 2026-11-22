
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

function PollDetails({ poll, onBack }) {
  if (!poll) {
    return (
      <main className="poll-details-page">
        <p>Poll not found.</p>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </main>
    );
  }

  const options = poll.options || [];

  const totalVotes = options.reduce(
    (total, option) => total + (option.votes || 0),
    0
  );

  return (
    <main className="poll-details-page">
      <header className="poll-details-header">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>

        <h2>Poll Details</h2>
      </header>

      <section className="poll-details-card">
        <h3>{poll.title}</h3>

        <span className="poll-details-status">
          {poll.status}
        </span>

        <p>{poll.description}</p>

        {poll.endDate && (
          <div className="poll-details-date">
            <CalendarDays size={15} />
            <span>
              Ends: {new Date(poll.endDate).toLocaleString()}
            </span>
          </div>
        )}

        <div className="poll-vote-heading">
          <Users size={17} />
          <span>Total Votes: {totalVotes}</span>
        </div>

        <div className="poll-results">
          {options.length === 0 ? (
            <p>
              No voting options available for this sample poll.
            </p>
          ) : (
            options.map((option) => {
              const votes = option.votes || 0;

              const percentage =
                totalVotes > 0
                  ? Math.round((votes / totalVotes) * 100)
                  : 0;

              return (
                <div
                  className="poll-result-option"
                  key={option.id}
                >
                  <div className="poll-result-label">
                    <span>{option.text}</span>

                    <span>
                      {votes} votes ({percentage}%)
                    </span>
                  </div>

                  <div className="poll-progress-track">
                    <div
                      className="poll-progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

export default PollDetails;
